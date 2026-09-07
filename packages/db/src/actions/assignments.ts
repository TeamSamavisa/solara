import { and, asc, count, desc, eq, exists, inArray, sql } from "drizzle-orm"
import { QueryBuilder } from "drizzle-orm/mysql-core"
import type { z } from "zod"

import { db } from "../client"
import {
  calculateOffset,
  paginate,
  type PaginatedResponse,
} from "../pagination"
import {
  assignments,
  assignmentSchedules,
  classGroups,
  createAssignmentSchema,
  DEFAULT_ASSIGNMENT_DURATION,
  listAssignmentsQuerySchema,
  schedules,
  scheduleTeachers,
  spaces,
  subjects,
  updateAssignmentSchema,
  users,
  type Assignment,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
} from "../schemas"
import {
  buildWhere,
  filterEq,
  hasUpdates,
  pickDefined,
  requireFound,
} from "./utils"

const NOT_FOUND = "Alocação não encontrada."

export type ListAssignmentsQueryInput = z.input<
  typeof listAssignmentsQuerySchema
>

export interface AssignmentScheduleData {
  id: number
  weekday: string
  start_time: string
  end_time: string
  shift_id: number
}

const assignmentSelection = {
  id: assignments.id,
  teacher_id: assignments.teacher_id,
  subject_id: assignments.subject_id,
  space_id: assignments.space_id,
  class_group_id: assignments.class_group_id,
  duration: assignments.duration,
  createdAt: assignments.createdAt,
  updatedAt: assignments.updatedAt,
  teacher: {
    id: users.id,
    full_name: users.full_name,
    email: users.email,
  },
  subject: {
    id: subjects.id,
    name: subjects.name,
  },
  space: {
    id: spaces.id,
    name: spaces.name,
    capacity: spaces.capacity,
  },
  classGroup: {
    id: classGroups.id,
    name: classGroups.name,
    shift_id: classGroups.shift_id,
  },
}

function selectAssignments() {
  return db
    .select(assignmentSelection)
    .from(assignments)
    .leftJoin(users, eq(assignments.teacher_id, users.id))
    .leftJoin(subjects, eq(assignments.subject_id, subjects.id))
    .leftJoin(spaces, eq(assignments.space_id, spaces.id))
    .leftJoin(classGroups, eq(assignments.class_group_id, classGroups.id))
}

type AssignmentRow = Awaited<ReturnType<typeof selectAssignments>>[number]

export type AssignmentWithRelations = AssignmentRow & {
  schedules: AssignmentScheduleData[]
  violates_availability: boolean
}

/**
 * An assignment violates the teacher availability when any of its schedules
 * belongs to a different shift than the class group, or when the teacher is
 * not declared available for every one of its schedules.
 */
export function violatesAvailability(input: {
  teacherId: number | null
  classGroupShiftId: number | null | undefined
  schedules: AssignmentScheduleData[]
  availableScheduleIds: ReadonlySet<number>
}): boolean {
  if (!input.teacherId || input.schedules.length === 0) return false

  const mismatchedShift = input.schedules.some(
    (schedule) => schedule.shift_id !== input.classGroupShiftId,
  )

  if (mismatchedShift) return true

  return !input.schedules.every((schedule) =>
    input.availableScheduleIds.has(schedule.id),
  )
}

export async function createAssignment(
  input: CreateAssignmentInput,
): Promise<AssignmentWithRelations> {
  const { schedule_ids: scheduleIds, ...data } =
    createAssignmentSchema.parse(input)

  const id = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(assignments)
      .values({
        teacher_id: data.teacher_id,
        subject_id: data.subject_id,
        space_id: data.space_id ?? null,
        class_group_id: data.class_group_id,
        duration: data.duration ?? DEFAULT_ASSIGNMENT_DURATION,
      })
      .$returningId()

    if (scheduleIds && scheduleIds.length > 0) {
      await tx.insert(assignmentSchedules).values(
        scheduleIds.map((scheduleId) => ({
          assignment_id: inserted.id,
          schedule_id: scheduleId,
        })),
      )
    }

    return inserted.id
  })

  return getAssignmentById(id)
}

export async function listAssignments(
  query: ListAssignmentsQueryInput = {},
): Promise<PaginatedResponse<AssignmentWithRelations>> {
  const { limit, page, ...filters } = listAssignmentsQuerySchema.parse(query)

  const where = buildWhere([
    filters.schedule_id === undefined
      ? undefined
      : hasScheduleFilter(filters.schedule_id),
    filterEq(assignments.teacher_id, filters.teacher_id),
    filterEq(assignments.subject_id, filters.subject_id),
    filterEq(assignments.space_id, filters.space_id),
    filterEq(assignments.class_group_id, filters.class_group_id),
  ])

  const rows = await selectAssignments()
    .where(where)
    .orderBy(desc(assignments.createdAt))
    .limit(limit)
    .offset(calculateOffset({ page, limit }))

  const [total] = await db
    .select({ value: count() })
    .from(assignments)
    .where(where)

  const content = await withScheduleData(rows)

  return paginate(content, { page, limit }, total?.value ?? 0)
}

export async function getAssignmentById(
  id: number,
): Promise<AssignmentWithRelations> {
  const [row] = await selectAssignments().where(eq(assignments.id, id)).limit(1)

  const assignment = requireFound(row, NOT_FOUND)
  const [withData] = await withScheduleData([assignment])

  return withData
}

export async function updateAssignment(
  id: number,
  input: UpdateAssignmentInput,
): Promise<AssignmentWithRelations> {
  const { schedule_ids: scheduleIds, ...rest } =
    updateAssignmentSchema.parse(input)

  await ensureAssignmentExists(id)

  const data = pickDefined(rest)

  await db.transaction(async (tx) => {
    if (hasUpdates(data)) {
      await tx.update(assignments).set(data).where(eq(assignments.id, id))
    }

    if (scheduleIds !== undefined) {
      await tx
        .delete(assignmentSchedules)
        .where(eq(assignmentSchedules.assignment_id, id))

      if (scheduleIds.length > 0) {
        await tx.insert(assignmentSchedules).values(
          scheduleIds.map((scheduleId) => ({
            assignment_id: id,
            schedule_id: scheduleId,
          })),
        )
      }
    }
  })

  return getAssignmentById(id)
}

export async function removeAssignment(id: number): Promise<Assignment> {
  const [row] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, id))
    .limit(1)

  const assignment = requireFound(row, NOT_FOUND)

  await db.transaction(async (tx) => {
    await tx
      .delete(assignmentSchedules)
      .where(eq(assignmentSchedules.assignment_id, id))
    await tx.delete(assignments).where(eq(assignments.id, id))
  })

  return assignment
}

/** `assignments` has no `schedule_id` column, so the join table is used. */
function hasScheduleFilter(scheduleId: number) {
  const builder = new QueryBuilder()

  return exists(
    builder
      .select({ value: sql`1` })
      .from(assignmentSchedules)
      .where(
        and(
          eq(assignmentSchedules.assignment_id, assignments.id),
          eq(assignmentSchedules.schedule_id, scheduleId),
        ),
      ),
  )
}

async function withScheduleData(
  rows: AssignmentRow[],
): Promise<AssignmentWithRelations[]> {
  if (rows.length === 0) return []

  const schedulesByAssignment = await loadSchedules(rows.map((row) => row.id))

  const teacherIds = [
    ...new Set(
      rows
        .filter(
          (row) => (schedulesByAssignment.get(row.id) ?? []).length > 0,
        )
        .map((row) => row.teacher_id)
        .filter((id): id is number => id !== null),
    ),
  ]

  const availability = await loadTeacherAvailability(teacherIds)

  return rows.map((row) => {
    const rowSchedules = schedulesByAssignment.get(row.id) ?? []

    return {
      ...row,
      schedules: rowSchedules,
      violates_availability: violatesAvailability({
        teacherId: row.teacher_id,
        classGroupShiftId: row.classGroup?.shift_id,
        schedules: rowSchedules,
        availableScheduleIds:
          availability.get(row.teacher_id ?? -1) ?? new Set<number>(),
      }),
    }
  })
}

async function loadSchedules(
  assignmentIds: number[],
): Promise<Map<number, AssignmentScheduleData[]>> {
  const grouped = new Map<number, AssignmentScheduleData[]>()

  if (assignmentIds.length === 0) return grouped

  const rows = await db
    .select({
      assignment_id: assignmentSchedules.assignment_id,
      id: schedules.id,
      weekday: schedules.weekday,
      start_time: schedules.start_time,
      end_time: schedules.end_time,
      shift_id: schedules.shift_id,
    })
    .from(assignmentSchedules)
    .innerJoin(schedules, eq(assignmentSchedules.schedule_id, schedules.id))
    .where(inArray(assignmentSchedules.assignment_id, assignmentIds))
    .orderBy(asc(assignmentSchedules.assignment_id), asc(schedules.id))

  for (const { assignment_id: assignmentId, ...schedule } of rows) {
    const current = grouped.get(assignmentId) ?? []
    current.push(schedule)
    grouped.set(assignmentId, current)
  }

  return grouped
}

async function loadTeacherAvailability(
  teacherIds: number[],
): Promise<Map<number, Set<number>>> {
  const grouped = new Map<number, Set<number>>()

  if (teacherIds.length === 0) return grouped

  const rows = await db
    .select({
      teacher_id: scheduleTeachers.teacher_id,
      schedule_id: scheduleTeachers.schedule_id,
    })
    .from(scheduleTeachers)
    .where(inArray(scheduleTeachers.teacher_id, teacherIds))

  for (const row of rows) {
    if (row.teacher_id === null || row.schedule_id === null) continue

    const current = grouped.get(row.teacher_id) ?? new Set<number>()
    current.add(row.schedule_id)
    grouped.set(row.teacher_id, current)
  }

  return grouped
}

async function ensureAssignmentExists(id: number): Promise<void> {
  const [row] = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(eq(assignments.id, id))
    .limit(1)

  requireFound(row, NOT_FOUND)
}
