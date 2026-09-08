import { violatesAvailability } from "./costs"
import { rowToSlot, type Matrix } from "./grid"
import type { PreparedAllocation, PreparedTimetable } from "./model"

export interface Conflict {
  scope: "teacher" | "class-group" | "availability"
  /** Whose timetable is broken. */
  name: string
  /** When it happens, e.g. `Monday 08h`. */
  slot: string
  /** The classes involved, described for a log line. */
  classes: string[]
}

function describe(allocation: PreparedAllocation): string {
  return `${allocation.classGroupName} · ${allocation.subjectName} · ${allocation.teacherName}`
}

function slotLabel(row: number): string {
  const slot = rowToSlot(row)

  return slot ? `${slot.weekday} ${String(slot.hour).padStart(2, "0")}h` : `linha ${row}`
}

function isUnavailable(
  allocation: PreparedAllocation,
  prepared: PreparedTimetable,
  row: number,
): boolean {
  // Reuses the cost function's own predicate, so the report always explains
  // the number the optimizer is actually chasing.
  return violatesAvailability(prepared, allocation.teacherId, row)
}

/**
 * Explains what is still wrong with a timetable, the way the legacy service's
 * conflict analysis did: who is double-booked, when, and with what.
 */
export function findConflicts(
  matrix: Matrix,
  prepared: PreparedTimetable,
): Conflict[] {
  const conflicts: Conflict[] = []

  for (let row = 0; row < matrix.length; row += 1) {
    const byTeacher = new Map<number, PreparedAllocation[]>()
    const byClassGroup = new Map<number, PreparedAllocation[]>()

    for (let column = 0; column < matrix[row].length; column += 1) {
      const index = matrix[row][column]
      if (index === null) continue

      const allocation = prepared.allocations[index]
      if (!allocation) continue

      byTeacher.set(allocation.teacherId, [
        ...(byTeacher.get(allocation.teacherId) ?? []),
        allocation,
      ])
      byClassGroup.set(allocation.classGroupId, [
        ...(byClassGroup.get(allocation.classGroupId) ?? []),
        allocation,
      ])

      if (isUnavailable(allocation, prepared, row)) {
        conflicts.push({
          scope: "availability",
          name: allocation.teacherName,
          slot: slotLabel(row),
          classes: [describe(allocation)],
        })
      }
    }

    for (const [, allocations] of byTeacher) {
      if (allocations.length < 2) continue

      conflicts.push({
        scope: "teacher",
        name: allocations[0].teacherName,
        slot: slotLabel(row),
        classes: allocations.map(describe),
      })
    }

    for (const [, allocations] of byClassGroup) {
      if (allocations.length < 2) continue

      conflicts.push({
        scope: "class-group",
        name: allocations[0].classGroupName,
        slot: slotLabel(row),
        classes: allocations.map(describe),
      })
    }
  }

  return conflicts
}
