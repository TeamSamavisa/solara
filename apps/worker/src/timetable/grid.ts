import {
  FIRST_HOUR,
  HOURS_PER_DAY,
  ROW_COUNT,
  WEEKDAYS,
  type Weekday,
} from "./constants"

export interface GridSlot {
  weekday: Weekday
  hour: number
}

/** A single cell of the timetable: one hour in one classroom. */
export interface GridCell {
  row: number
  classroom: number
}

/**
 * `matrix[row][classroom]` holds the index of the allocation occupying that
 * cell, or `null` when it is free.
 */
export type Matrix = (number | null)[][]

export interface Grid {
  matrix: Matrix
  free: GridCell[]
}

export function rowToSlot(row: number): GridSlot | null {
  if (!Number.isInteger(row) || row < 0 || row >= ROW_COUNT) return null

  return {
    weekday: WEEKDAYS[Math.floor(row / HOURS_PER_DAY)],
    hour: FIRST_HOUR + (row % HOURS_PER_DAY),
  }
}

export function slotToRow(weekday: string, hour: number): number | null {
  const day = WEEKDAYS.indexOf(weekday as Weekday)
  const hourIndex = hour - FIRST_HOUR

  if (day < 0 || hourIndex < 0 || hourIndex >= HOURS_PER_DAY) return null

  return day * HOURS_PER_DAY + hourIndex
}

/**
 * A class may not start on one day and finish on the next, so a block is only
 * valid while it stays inside the day it started in.
 */
export function fitsInSingleDay(startRow: number, duration: number): boolean {
  const endRow = startRow + duration - 1

  if (endRow >= ROW_COUNT) return false

  return Math.floor(startRow / HOURS_PER_DAY) === Math.floor(endRow / HOURS_PER_DAY)
}

export function createGrid(classroomCount: number): Grid {
  const matrix: Matrix = Array.from({ length: ROW_COUNT }, () =>
    Array.from({ length: classroomCount }, () => null),
  )

  const free: GridCell[] = []
  for (let row = 0; row < ROW_COUNT; row += 1) {
    for (let classroom = 0; classroom < classroomCount; classroom += 1) {
      free.push({ row, classroom })
    }
  }

  return { matrix, free }
}
