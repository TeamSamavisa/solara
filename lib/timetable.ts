import type { AssignmentWithRelations } from "@/lib/db/actions/assignments"
import { WEEKDAYS } from "@/lib/weekdays"

export interface TimetableCell {
  subject: string
  teacher: string
  space: string
  violatesAvailability: boolean
}

export interface Timetable {
  /** Row labels, e.g. `07:30 - 09:10`, ordered chronologically. */
  slots: string[]
  /** `grid[weekdayValue][slot]` holds every class in that cell. */
  grid: Record<string, Record<string, TimetableCell[]>>
}

const PLACEHOLDER = "—"

export function slotLabel(start: string, end: string): string {
  return `${start} - ${end}`
}

/** `HH:MM` to minutes, so `7:30` sorts before `10:00`. */
function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":")

  return Number(hours) * 60 + Number(minutes)
}

/**
 * Pivots the assignments into the printable weekday × time grid used by the
 * legacy print tab. A class occupying several schedules appears in each of the
 * corresponding cells.
 */
export function buildTimetable(
  assignments: AssignmentWithRelations[],
): Timetable {
  const starts = new Map<string, number>()

  for (const assignment of assignments) {
    for (const schedule of assignment.schedules) {
      const label = slotLabel(schedule.start_time, schedule.end_time)

      if (!starts.has(label)) starts.set(label, toMinutes(schedule.start_time))
    }
  }

  const slots = [...starts.entries()]
    .sort(([labelA, startA], [labelB, startB]) =>
      startA === startB ? labelA.localeCompare(labelB) : startA - startB,
    )
    .map(([label]) => label)

  const grid: Timetable["grid"] = {}

  for (const weekday of WEEKDAYS) {
    grid[weekday.value] = {}
    for (const slot of slots) grid[weekday.value][slot] = []
  }

  for (const assignment of assignments) {
    for (const schedule of assignment.schedules) {
      const slot = slotLabel(schedule.start_time, schedule.end_time)
      const day = grid[schedule.weekday]

      // Weekdays outside the printed columns (e.g. Sunday) are skipped.
      if (!day?.[slot]) continue

      day[slot].push({
        subject: assignment.subject?.name ?? PLACEHOLDER,
        teacher: assignment.teacher?.full_name ?? PLACEHOLDER,
        space: assignment.space?.name ?? PLACEHOLDER,
        violatesAvailability: Boolean(assignment.violates_availability),
      })
    }
  }

  return { slots, grid }
}
