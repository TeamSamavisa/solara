import { HOURS_PER_DAY } from "./constants"
import type { Matrix } from "./grid"
import type { PreparedTimetable } from "./model"

export interface EmptySpaceCost {
  total: number
  maxPerDay: number
  average: number
}

/**
 * Measures the gaps left in someone's day — the soft constraint the annealing
 * phase tries to reduce. `occupancy` maps an entity (class group or teacher)
 * to the rows it occupies.
 *
 * Deliberate fix over the legacy implementation: it iterated
 * `range(1, len(times) - 1)`, which never looked at the final pair, so the
 * last gap of every entity went uncounted — and an entity with exactly two
 * classes always scored zero.
 */
export function emptySpaceCost(
  occupancy: Map<number, number[]>,
): EmptySpaceCost {
  let total = 0
  let maxPerDay = 0

  for (const times of occupancy.values()) {
    const sorted = [...times].sort((a, b) => a - b)
    const emptyPerDay = new Map<number, number>()

    for (let i = 1; i < sorted.length; i += 1) {
      const previous = sorted[i - 1]
      const current = sorted[i]
      const gap = current - previous
      const sameDay =
        Math.floor(previous / HOURS_PER_DAY) ===
        Math.floor(current / HOURS_PER_DAY)

      if (sameDay && gap > 1) {
        const day = Math.floor(previous / HOURS_PER_DAY)
        emptyPerDay.set(day, (emptyPerDay.get(day) ?? 0) + gap - 1)
        total += gap - 1
      }
    }

    for (const value of emptyPerDay.values()) {
      if (value > maxPerDay) maxPerDay = value
    }
  }

  if (occupancy.size === 0) return { total: 0, maxPerDay: 0, average: 0 }

  return { total, maxPerDay, average: total / occupancy.size }
}

export interface HardConstraintsCost {
  total: number
  /** Indexed by allocation index, used to mutate the worst offenders first. */
  perAllocation: number[]
  teacher: number
  classroom: number
  group: number
  availability: number
}

/**
 * True when the teacher declared availability and this row is not part of it.
 * A teacher with no declared availability is treated as always available, as
 * in the legacy service.
 */
export function violatesAvailability(
  prepared: PreparedTimetable,
  teacherId: number,
  row: number,
): boolean {
  const available = prepared.teacherSchedules.get(teacherId)

  if (!available || available.size === 0) return false

  const scheduleId = prepared.scheduleByRow.get(row)

  return scheduleId === undefined || !available.has(scheduleId)
}

export function hardConstraintsCost(
  matrix: Matrix,
  prepared: PreparedTimetable,
): HardConstraintsCost {
  const perAllocation = new Array<number>(prepared.allocations.length).fill(0)
  let teacher = 0
  let classroom = 0
  let group = 0
  let availability = 0

  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix[row].length; column += 1) {
      const index = matrix[row][column]
      if (index === null) continue

      const allocation = prepared.allocations[index]
      if (!allocation) continue

      if (!allocation.possibleClassrooms.has(column)) {
        classroom += 1
        perAllocation[index] += 1
      }

      if (violatesAvailability(prepared, allocation.teacherId, row)) {
        availability += 1
        perAllocation[index] += 1
      }

      // Only look forward, so a conflicting pair is charged once.
      for (let other = column + 1; other < matrix[row].length; other += 1) {
        const otherIndex = matrix[row][other]
        if (otherIndex === null) continue

        const otherAllocation = prepared.allocations[otherIndex]
        if (!otherAllocation) continue

        if (allocation.teacherId === otherAllocation.teacherId) {
          teacher += 1
          perAllocation[index] += 1
        }

        if (allocation.classGroupId === otherAllocation.classGroupId) {
          group += 1
          perAllocation[index] += 1
        }
      }
    }
  }

  return {
    total: teacher + classroom + group + availability,
    perAllocation,
    teacher,
    classroom,
    group,
    availability,
  }
}

/**
 * Number of constraint violations in the timetable. Unlike
 * `hardConstraintsCost`, a conflicting pair is counted from both sides, which
 * is what the legacy statistics reported.
 */
export function countHardViolations(
  matrix: Matrix,
  prepared: PreparedTimetable,
): number {
  let overlaps = 0

  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix[row].length; column += 1) {
      const index = matrix[row][column]
      if (index === null) continue

      const allocation = prepared.allocations[index]
      if (!allocation) continue

      if (!allocation.possibleClassrooms.has(column)) overlaps += 1

      if (violatesAvailability(prepared, allocation.teacherId, row)) {
        overlaps += 1
      }

      for (let other = 0; other < matrix[row].length; other += 1) {
        if (other === column) continue

        const otherIndex = matrix[row][other]
        if (otherIndex === null) continue

        const otherAllocation = prepared.allocations[otherIndex]
        if (!otherAllocation) continue

        if (allocation.teacherId === otherAllocation.teacherId) overlaps += 1
        if (allocation.classGroupId === otherAllocation.classGroupId) {
          overlaps += 1
        }
      }
    }
  }

  return overlaps
}
