import { createGrid, fitsInSingleDay, type GridCell, type Matrix } from "./grid"
import type { PreparedTimetable } from "./model"
import { shuffled } from "./shuffle"

export interface TimetableState {
  matrix: Matrix
  /** Free cells in scan order; the first fitting one is always taken. */
  free: GridCell[]
  /** Allocation index to the cells it occupies. */
  filled: Map<number, GridCell[]>
  /** Class group id to the rows it occupies. */
  groupOccupancy: Map<number, number[]>
  /** Teacher id to the rows they occupy. */
  teacherOccupancy: Map<number, number[]>
  /** Mirrors `free` for O(1) membership tests. */
  freeKeys: Set<number>
  columnCount: number
}

export interface FailedPlacement {
  allocationId: number
  classGroup: string
  subject: string
  teacher: string
  duration: number
  compatibleClassrooms: number
}

function cellKey(state: TimetableState, cell: GridCell): number {
  return cell.row * state.columnCount + cell.classroom
}

export function createState(prepared: PreparedTimetable): TimetableState {
  const { matrix, free } = createGrid(prepared.classrooms.length)

  const state: TimetableState = {
    matrix,
    free,
    filled: new Map(),
    groupOccupancy: new Map(prepared.classGroupIds.map((id) => [id, []])),
    teacherOccupancy: new Map(prepared.teacherIds.map((id) => [id, []])),
    freeKeys: new Set(),
    columnCount: prepared.classrooms.length,
  }

  for (const cell of free) state.freeKeys.add(cellKey(state, cell))

  return state
}

function isFree(state: TimetableState, row: number, classroom: number): boolean {
  return state.freeKeys.has(row * state.columnCount + classroom)
}

function takeCell(state: TimetableState, cell: GridCell): void {
  const key = cellKey(state, cell)
  state.freeKeys.delete(key)

  const index = state.free.findIndex(
    (candidate) =>
      candidate.row === cell.row && candidate.classroom === cell.classroom,
  )
  if (index >= 0) state.free.splice(index, 1)
}

function releaseCell(state: TimetableState, cell: GridCell): void {
  const key = cellKey(state, cell)
  if (state.freeKeys.has(key)) return

  state.freeKeys.add(key)
  state.free.push({ ...cell })
}

function addOccupancy(
  occupancy: Map<number, number[]>,
  id: number,
  row: number,
): void {
  const rows = occupancy.get(id)
  if (rows) rows.push(row)
  else occupancy.set(id, [row])
}

function removeOccupancy(
  occupancy: Map<number, number[]>,
  id: number,
  row: number,
): void {
  const rows = occupancy.get(id)
  if (!rows) return

  const index = rows.indexOf(row)
  if (index >= 0) rows.splice(index, 1)
}

/**
 * Whether the row carries a schedule belonging to the class group's shift.
 *
 * This is the structural requirement: a class placed on a row without a
 * matching schedule could never be mapped back to a real time slot.
 */
export function hasScheduleForShift(
  prepared: PreparedTimetable,
  allocationIndex: number,
  row: number,
): boolean {
  const allocation = prepared.allocations[allocationIndex]
  if (!allocation) return false

  return prepared.scheduleByRowAndShift.has(
    `${row}:${allocation.classGroupShiftId}`,
  )
}

/**
 * Whether the allocation may occupy `row`, ignoring whether the cells are
 * free — that is checked separately. Adds teacher availability and
 * teacher/group conflicts on top of the structural check.
 *
 * Deliberate fix over the legacy implementation: it looked up the schedule of
 * a row ignoring the shift, so a class could be placed on a row that carried
 * no schedule for its own shift (or none at all), producing a result the web
 * app could not map back to a real time slot.
 */
export function canPlaceAtRow(
  state: TimetableState,
  prepared: PreparedTimetable,
  allocationIndex: number,
  row: number,
): boolean {
  const allocation = prepared.allocations[allocationIndex]
  if (!allocation) return false

  const scheduleId = prepared.scheduleByRowAndShift.get(
    `${row}:${allocation.classGroupShiftId}`,
  )
  if (scheduleId === undefined) return false

  const available = prepared.teacherSchedules.get(allocation.teacherId)
  if (available && available.size > 0 && !available.has(scheduleId)) {
    return false
  }

  for (let column = 0; column < state.matrix[row].length; column += 1) {
    const otherIndex = state.matrix[row][column]
    if (otherIndex === null || otherIndex === allocationIndex) continue

    const other = prepared.allocations[otherIndex]
    if (!other) continue

    if (other.teacherId === allocation.teacherId) return false
    if (other.classGroupId === allocation.classGroupId) return false
  }

  return true
}

/** Whether the whole block starting at `start` is free and valid. */
function blockFits(
  state: TimetableState,
  prepared: PreparedTimetable,
  allocationIndex: number,
  start: GridCell,
  duration: number,
  checkConflicts: boolean,
): boolean {
  if (!fitsInSingleDay(start.row, duration)) return false

  const allocation = prepared.allocations[allocationIndex]
  if (!allocation.possibleClassrooms.has(start.classroom)) return false

  for (let offset = 0; offset < duration; offset += 1) {
    const row = start.row + offset

    if (!isFree(state, row, start.classroom)) return false
    if (!hasScheduleForShift(prepared, allocationIndex, row)) return false
    if (
      checkConflicts &&
      !canPlaceAtRow(state, prepared, allocationIndex, row)
    ) {
      return false
    }
  }

  return true
}

function occupy(
  state: TimetableState,
  prepared: PreparedTimetable,
  allocationIndex: number,
  start: GridCell,
): void {
  const allocation = prepared.allocations[allocationIndex]
  const cells: GridCell[] = []

  for (let offset = 0; offset < allocation.duration; offset += 1) {
    const cell = { row: start.row + offset, classroom: start.classroom }

    cells.push(cell)
    takeCell(state, cell)
    state.matrix[cell.row][cell.classroom] = allocationIndex
    addOccupancy(state.groupOccupancy, allocation.classGroupId, cell.row)
    addOccupancy(state.teacherOccupancy, allocation.teacherId, cell.row)
  }

  state.filled.set(allocationIndex, cells)
}

function vacate(
  state: TimetableState,
  prepared: PreparedTimetable,
  allocationIndex: number,
): void {
  const cells = state.filled.get(allocationIndex)
  if (!cells) return

  const allocation = prepared.allocations[allocationIndex]
  state.filled.delete(allocationIndex)

  for (const cell of cells) {
    state.matrix[cell.row][cell.classroom] = null
    releaseCell(state, cell)
    removeOccupancy(state.groupOccupancy, allocation.classGroupId, cell.row)
    removeOccupancy(state.teacherOccupancy, allocation.teacherId, cell.row)
  }
}

export interface InitialPlacement {
  placed: number
  failed: FailedPlacement[]
}

/**
 * Fills the grid with a first timetable: each class goes into the first block
 * of free cells in a compatible room, on rows that carry a schedule for its
 * shift.
 *
 * Conflicts between teachers or class groups are deliberately allowed here.
 * Refusing them would leave allocations unplaced, and an unplaced class can
 * never be recovered — the optimizer only moves classes that are already on
 * the grid. Placing everything and letting the optimizer resolve the overlaps
 * yields far more complete timetables.
 */
export function placeInitial(
  state: TimetableState,
  prepared: PreparedTimetable,
  random?: () => number,
): InitialPlacement {
  const failed: FailedPlacement[] = []

  // Indices stay tied to `prepared.allocations`; only the order in which the
  // greedy first-fit visits them is shuffled.
  const order = prepared.allocations.map((_, index) => index)
  const visitOrder = random ? shuffled(order, random) : order

  for (const index of visitOrder) {
    const allocation = prepared.allocations[index]

    // Prefer a conflict-free spot, then settle for a structurally valid one.
    const start =
      state.free.find((cell) =>
        blockFits(state, prepared, index, cell, allocation.duration, true),
      ) ??
      state.free.find((cell) =>
        blockFits(state, prepared, index, cell, allocation.duration, false),
      )

    if (!start) {
      failed.push({
        allocationId: allocation.id,
        classGroup: allocation.classGroupName,
        subject: allocation.subjectName,
        teacher: allocation.teacherName,
        duration: allocation.duration,
        compatibleClassrooms: allocation.possibleClassrooms.size,
      })
      continue
    }

    occupy(state, prepared, index, start)
  }

  return { placed: state.filled.size, failed }
}

/**
 * Looks for a spot where the class breaks no hard constraint and moves it
 * there. Returns whether it moved.
 */
export function mutateIdealSpot(
  state: TimetableState,
  prepared: PreparedTimetable,
  allocationIndex: number,
): boolean {
  const current = state.filled.get(allocationIndex)
  if (!current) return false

  const allocation = prepared.allocations[allocationIndex]

  // The cells the class currently holds count as available to itself, so a
  // block overlapping its own position is still a candidate.
  const candidates = [...state.free, ...current]

  const start = candidates.find((cell) => {
    if (!fitsInSingleDay(cell.row, allocation.duration)) return false
    if (!allocation.possibleClassrooms.has(cell.classroom)) return false

    for (let offset = 0; offset < allocation.duration; offset += 1) {
      const row = cell.row + offset
      const occupant = state.matrix[row][cell.classroom]

      if (occupant !== null && occupant !== allocationIndex) return false
      if (!canPlaceAtRow(state, prepared, allocationIndex, row)) return false
    }

    return true
  })

  if (!start) return false

  vacate(state, prepared, allocationIndex)
  occupy(state, prepared, allocationIndex, start)

  return true
}
