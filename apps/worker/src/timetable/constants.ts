/**
 * The optimizer works on a fixed weekly grid, ported from the legacy Python
 * service: 5 weekdays of 17 one-hour slots, from 06:00 to 22:00.
 *
 * A slot is addressed by a single row index, so `row = day * 17 + (hour - 6)`.
 */
export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const

export type Weekday = (typeof WEEKDAYS)[number]

export const HOURS_PER_DAY = 17
export const FIRST_HOUR = 6
export const ROW_COUNT = WEEKDAYS.length * HOURS_PER_DAY
