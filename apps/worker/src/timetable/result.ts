import { countHardViolations, emptySpaceCost } from "./costs"
import { rowToSlot } from "./grid"
import type { PreparedTimetable } from "./model"
import type { TimetableState } from "./placement"

export interface ScheduledSlot {
  day: string
  hour: number
  schedule_id: number
}

export interface ScheduledClass {
  allocation_id: number
  schedule_ids: number[]
  class_group: {
    id: number
    name: string
    course: string
    shift: string
    shift_id: number
  }
  subject: { id: number; name: string }
  teacher: { id: number; name: string }
  classroom: { id: number; name: string; floor: number }
  time_slots: ScheduledSlot[]
  duration: number
}

export interface OptimizationStatistics {
  hard_constraints_satisfied: boolean
  hard_constraints_cost: number
  total_allocations: number
  placed_allocations: number
  groups_empty_space: {
    total: number
    max_per_day: number
    average_per_week: number
  }
  teachers_empty_space: {
    total: number
    max_per_day: number
    average_per_week: number
  }
}

export interface OptimizationResult {
  schedule: ScheduledClass[]
  statistics: OptimizationStatistics
}

/**
 * Turns the solved grid into the payload the web app persists. The shape
 * matches the legacy Python consumer, so the consumer side is unchanged.
 */
export function buildResult(
  state: TimetableState,
  prepared: PreparedTimetable,
): OptimizationResult {
  const schedule: ScheduledClass[] = []

  for (const [allocationIndex, cells] of state.filled) {
    const allocation = prepared.allocations[allocationIndex]
    if (!allocation || cells.length === 0) continue

    const classroom = prepared.classrooms[cells[0].classroom]
    if (!classroom) continue

    const scheduleIds: number[] = []
    const timeSlots: ScheduledSlot[] = []

    for (const cell of cells) {
      const slot = rowToSlot(cell.row)
      if (!slot) continue

      // Only a schedule of the group's own shift is a valid target.
      const scheduleId = prepared.scheduleByRowAndShift.get(
        `${cell.row}:${allocation.classGroupShiftId}`,
      )
      if (scheduleId === undefined) continue

      scheduleIds.push(scheduleId)
      timeSlots.push({
        day: slot.weekday,
        hour: slot.hour,
        schedule_id: scheduleId,
      })
    }

    schedule.push({
      allocation_id: allocation.id,
      schedule_ids: scheduleIds,
      class_group: {
        id: allocation.classGroupId,
        name: allocation.classGroupName,
        course: allocation.courseName,
        shift: allocation.shiftName,
        shift_id: allocation.classGroupShiftId,
      },
      subject: { id: allocation.subjectId, name: allocation.subjectName },
      teacher: { id: allocation.teacherId, name: allocation.teacherName },
      classroom: {
        id: classroom.id,
        name: classroom.name,
        floor: classroom.floor,
      },
      time_slots: timeSlots,
      duration: allocation.duration,
    })
  }

  const violations = countHardViolations(state.matrix, prepared)
  const groups = emptySpaceCost(state.groupOccupancy)
  const teachers = emptySpaceCost(state.teacherOccupancy)

  return {
    schedule,
    statistics: {
      hard_constraints_satisfied: violations === 0,
      hard_constraints_cost: violations,
      total_allocations: prepared.allocations.length,
      placed_allocations: state.filled.size,
      groups_empty_space: {
        total: groups.total,
        max_per_day: groups.maxPerDay,
        average_per_week: groups.average,
      },
      teachers_empty_space: {
        total: teachers.total,
        max_per_day: teachers.maxPerDay,
        average_per_week: teachers.average,
      },
    },
  }
}
