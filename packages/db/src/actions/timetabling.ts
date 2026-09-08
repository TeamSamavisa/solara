import { asc, eq, inArray, sql } from "drizzle-orm"

import { db } from "../client"
import {
  assignments,
  assignmentSchedules,
  classGroups,
  courses,
  courseTypes,
  schedules,
  scheduleTeachers,
  shifts,
  spaces,
  spaceTypes,
  subjects,
  TEACHING_ROLES,
  users,
} from "../schemas"

/**
 * Payload handed to the timetabling worker. The shape is the one the legacy
 * Python service consumed, so the worker side is unchanged.
 */
export interface TimetablePayload {
  space_types: { id: number; name: string }[]
  classrooms: {
    id: number
    name: string
    floor: number
    capacity: number
    blocked: boolean
    space_type_id: number | null
  }[]
  course_types: { id: number; name: string }[]
  courses: { id: number; name: string; course_type_id: number | null }[]
  shifts: { id: number; name: string }[]
  teachers: { id: number; full_name: string }[]
  subjects: {
    id: number
    name: string
    required_space_type_id: number | null
    course_id: number | null
  }[]
  schedules: {
    id: number
    weekday: string
    start_time: string
    end_time: string
    shift_id: number
  }[]
  class_groups: {
    id: number
    name: string
    course_id: number | null
    shift_id: number | null
    student_count: number
  }[]
  class_allocations: {
    id: number
    class_group_id: number | null
    subject_id: number | null
    teacher_id: number | null
    duration: number
  }[]
  teacher_schedules: Record<string, number[]>
}

/**
 * Reads everything the optimizer needs in one pass.
 *
 * Deliberate change over the legacy service: it only collected users with the
 * exact role `teacher`, so an assignment given to a coordinator referenced a
 * teacher that was missing from the payload and the whole class was silently
 * dropped. This uses the same teaching roles as the rest of the app.
 */
export async function collectTimetableData(): Promise<TimetablePayload> {
  const [
    spaceTypeRows,
    classroomRows,
    courseTypeRows,
    courseRows,
    shiftRows,
    teacherRows,
    subjectRows,
    scheduleRows,
    classGroupRows,
    allocationRows,
    availabilityRows,
  ] = await Promise.all([
    db.select({ id: spaceTypes.id, name: spaceTypes.name }).from(spaceTypes),
    db
      .select({
        id: spaces.id,
        name: spaces.name,
        floor: spaces.floor,
        capacity: spaces.capacity,
        blocked: spaces.blocked,
        space_type_id: spaces.space_type_id,
      })
      .from(spaces),
    db.select({ id: courseTypes.id, name: courseTypes.name }).from(courseTypes),
    db
      .select({
        id: courses.id,
        name: courses.name,
        course_type_id: courses.course_type_id,
      })
      .from(courses),
    db.select({ id: shifts.id, name: shifts.name }).from(shifts),
    db
      .select({ id: users.id, full_name: users.full_name })
      .from(users)
      .where(inArray(users.role, [...TEACHING_ROLES])),
    db
      .select({
        id: subjects.id,
        name: subjects.name,
        required_space_type_id: subjects.required_space_type_id,
        course_id: subjects.course_id,
      })
      .from(subjects),
    db
      .select({
        id: schedules.id,
        weekday: schedules.weekday,
        start_time: schedules.start_time,
        end_time: schedules.end_time,
        shift_id: schedules.shift_id,
      })
      .from(schedules),
    db
      .select({
        id: classGroups.id,
        name: classGroups.name,
        course_id: classGroups.course_id,
        shift_id: classGroups.shift_id,
        student_count: classGroups.student_count,
      })
      .from(classGroups),
    db
      .select({
        id: assignments.id,
        class_group_id: assignments.class_group_id,
        subject_id: assignments.subject_id,
        teacher_id: assignments.teacher_id,
        duration: assignments.duration,
      })
      .from(assignments)
      .orderBy(asc(assignments.id)),
    db
      .select({
        teacher_id: scheduleTeachers.teacher_id,
        schedule_id: scheduleTeachers.schedule_id,
      })
      .from(scheduleTeachers),
  ])

  const teacherSchedules: Record<string, number[]> = {}
  for (const row of availabilityRows) {
    if (row.teacher_id === null || row.schedule_id === null) continue

    const key = String(row.teacher_id)
    teacherSchedules[key] = [...(teacherSchedules[key] ?? []), row.schedule_id]
  }

  return {
    space_types: spaceTypeRows,
    classrooms: classroomRows.map((room) => ({
      ...room,
      blocked: room.blocked ?? false,
    })),
    course_types: courseTypeRows,
    courses: courseRows,
    shifts: shiftRows,
    teachers: teacherRows,
    subjects: subjectRows,
    schedules: scheduleRows,
    class_groups: classGroupRows.map((group) => ({
      ...group,
      student_count: group.student_count ?? 0,
    })),
    class_allocations: allocationRows,
    teacher_schedules: teacherSchedules,
  }
}

/** One optimized class, as produced by the worker. */
export interface OptimizedEntry {
  allocation_id: number
  schedule_ids: number[]
  classroom?: { id: number }
}

export interface AppliedSchedule {
  updated: number
  linkedSchedules: number
}

/**
 * Writes the optimizer's answer back: each class gets its room and its time
 * slots. Runs in one transaction so a partial result never reaches the UI.
 */
export async function applyOptimizedSchedule(
  entries: OptimizedEntry[],
): Promise<AppliedSchedule> {
  const usable = entries.filter(
    (entry) => Number.isInteger(entry.allocation_id) && entry.allocation_id > 0,
  )

  if (usable.length === 0) return { updated: 0, linkedSchedules: 0 }

  let linkedSchedules = 0

  await db.transaction(async (tx) => {
    for (const entry of usable) {
      if (entry.classroom?.id) {
        await tx
          .update(assignments)
          .set({ space_id: entry.classroom.id })
          .where(eq(assignments.id, entry.allocation_id))
      }

      // Replace the previous slots wholesale, so a class never keeps a stale
      // time from an earlier run.
      await tx
        .delete(assignmentSchedules)
        .where(eq(assignmentSchedules.assignment_id, entry.allocation_id))

      if (entry.schedule_ids.length > 0) {
        await tx.insert(assignmentSchedules).values(
          entry.schedule_ids.map((scheduleId) => ({
            assignment_id: entry.allocation_id,
            schedule_id: scheduleId,
          })),
        )
        linkedSchedules += entry.schedule_ids.length
      }
    }
  })

  return { updated: usable.length, linkedSchedules }
}

/** Clears every optimized placement, used before a fresh run. */
export async function clearAllocations(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(assignmentSchedules)
    await tx.update(assignments).set({ space_id: null })
  })
}

export interface AllocationStatistics {
  total: number
  scheduled: number
  pending: number
}

export async function getAllocationStatistics(): Promise<AllocationStatistics> {
  const [totals] = await db
    .select({
      // The left join fans out one row per linked schedule, so both counters
      // have to be distinct on the assignment.
      total: sql<number>`count(distinct ${assignments.id})`,
      scheduled: sql<number>`count(distinct case when ${assignmentSchedules.id} is not null then ${assignments.id} end)`,
    })
    .from(assignments)
    .leftJoin(
      assignmentSchedules,
      eq(assignmentSchedules.assignment_id, assignments.id),
    )

  const total = Number(totals?.total ?? 0)
  const scheduled = Number(totals?.scheduled ?? 0)

  return { total, scheduled, pending: total - scheduled }
}
