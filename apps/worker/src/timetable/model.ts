import { slotToRow } from "./grid"
import type { ScheduleInput, TimetableInput } from "./schema"

export interface PreparedClassroom {
  id: number
  name: string
  floor: number
  capacity: number
  blocked: boolean
  spaceTypeId: number
}

export interface PreparedAllocation {
  id: number
  classGroupId: number
  classGroupName: string
  classGroupShiftId: number
  courseName: string
  shiftName: string
  subjectId: number
  subjectName: string
  teacherId: number
  teacherName: string
  duration: number
  /**
   * Matrix column indices this class may occupy. Columns index the
   * `classrooms` array, not classroom ids — see `prepareTimetable`.
   */
  possibleClassrooms: Set<number>
}

export interface PreparedTimetable {
  /** Column index in the matrix maps to this array. */
  classrooms: PreparedClassroom[]
  /** Allocation index in the matrix maps to this array. */
  allocations: PreparedAllocation[]
  schedules: Map<number, ScheduleInput>
  /** Teacher id to the schedule ids they declared availability for. */
  teacherSchedules: Map<number, Set<number>>
  classGroupIds: number[]
  teacherIds: number[]
  /** Rows that carry a schedule, indexed by `${row}:${shiftId}`. */
  scheduleByRowAndShift: Map<string, number>
  /** First schedule found on a row, regardless of shift. */
  scheduleByRow: Map<number, number>
}

function indexById<T extends { id: number }>(items: T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]))
}

/**
 * Turns the validated payload into the structures the optimizer works on.
 *
 * Deliberate fix over the legacy implementation: there, matrix columns were
 * `0..n-1` but the compatible-classroom set held classroom *ids*. With
 * auto-increment ids starting at 1 that made column 0 unusable and shifted
 * every other column onto the wrong room. Here a column is simply the index
 * into `classrooms`, so the two can never drift apart.
 */
export function prepareTimetable(input: TimetableInput): PreparedTimetable {
  const classrooms: PreparedClassroom[] = input.classrooms.map((room) => ({
    id: room.id,
    name: room.name,
    floor: room.floor,
    capacity: room.capacity,
    blocked: room.blocked,
    spaceTypeId: room.space_type_id,
  }))

  const subjects = indexById(input.subjects)
  const teachers = indexById(input.teachers)
  const classGroups = indexById(input.class_groups)
  const courses = indexById(input.courses)
  const shifts = indexById(input.shifts)

  const allocations: PreparedAllocation[] = []
  for (const allocation of input.class_allocations) {
    const subject = subjects.get(allocation.subject_id)
    const teacher = teachers.get(allocation.teacher_id)
    const classGroup = classGroups.get(allocation.class_group_id)

    // An allocation missing any of its relations cannot be scheduled, and
    // keeping it would corrupt every index that follows.
    if (!subject || !teacher || !classGroup) continue

    const possibleClassrooms = new Set<number>()
    classrooms.forEach((room, column) => {
      if (!room.blocked && room.spaceTypeId === subject.required_space_type_id) {
        possibleClassrooms.add(column)
      }
    })

    allocations.push({
      id: allocation.id,
      classGroupId: classGroup.id,
      classGroupName: classGroup.name,
      classGroupShiftId: classGroup.shift_id,
      courseName: classGroup.course_id
        ? (courses.get(classGroup.course_id)?.name ?? "")
        : "",
      shiftName: shifts.get(classGroup.shift_id)?.name ?? "",
      subjectId: subject.id,
      subjectName: subject.name,
      teacherId: teacher.id,
      teacherName: teacher.full_name,
      duration: allocation.duration,
      possibleClassrooms,
    })
  }

  const scheduleByRowAndShift = new Map<string, number>()
  const scheduleByRow = new Map<number, number>()

  for (const schedule of input.schedules) {
    const hour = Number(schedule.start_time.slice(0, 2))
    const row = slotToRow(schedule.weekday, hour)

    if (row === null) continue

    const key = `${row}:${schedule.shift_id}`
    // The first schedule wins, matching the legacy lookup order.
    if (!scheduleByRowAndShift.has(key)) {
      scheduleByRowAndShift.set(key, schedule.id)
    }
    if (!scheduleByRow.has(row)) scheduleByRow.set(row, schedule.id)
  }

  const teacherSchedules = new Map<number, Set<number>>()
  for (const [teacherId, scheduleIds] of Object.entries(
    input.teacher_schedules,
  )) {
    teacherSchedules.set(Number(teacherId), new Set(scheduleIds))
  }

  return {
    classrooms,
    allocations,
    schedules: indexById(input.schedules),
    teacherSchedules,
    classGroupIds: input.class_groups.map((group) => group.id),
    teacherIds: input.teachers.map((teacher) => teacher.id),
    scheduleByRowAndShift,
    scheduleByRow,
  }
}
