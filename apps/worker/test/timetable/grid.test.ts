import {
  createGrid,
  fitsInSingleDay,
  rowToSlot,
  slotToRow,
} from "@/timetable/grid"
import { ROW_COUNT } from "@/timetable/constants"

describe("rowToSlot", () => {
  it("maps the first row to Monday at 06:00", () => {
    expect(rowToSlot(0)).toEqual({ weekday: "Monday", hour: 6 })
  })

  it("maps the last row of a day to 22:00", () => {
    expect(rowToSlot(16)).toEqual({ weekday: "Monday", hour: 22 })
  })

  it("rolls over to the next weekday", () => {
    expect(rowToSlot(17)).toEqual({ weekday: "Tuesday", hour: 6 })
    expect(rowToSlot(34)).toEqual({ weekday: "Wednesday", hour: 6 })
  })

  it("maps the very last row of the week", () => {
    expect(rowToSlot(ROW_COUNT - 1)).toEqual({ weekday: "Friday", hour: 22 })
  })

  it("returns null outside the grid", () => {
    expect(rowToSlot(-1)).toBeNull()
    expect(rowToSlot(ROW_COUNT)).toBeNull()
    expect(rowToSlot(1.5)).toBeNull()
  })
})

describe("slotToRow", () => {
  it("is the inverse of rowToSlot", () => {
    for (const row of [0, 16, 17, 42, ROW_COUNT - 1]) {
      const slot = rowToSlot(row)!
      expect(slotToRow(slot.weekday, slot.hour)).toBe(row)
    }
  })

  it("returns null for an hour outside the grid", () => {
    expect(slotToRow("Monday", 5)).toBeNull()
    expect(slotToRow("Monday", 23)).toBeNull()
  })
})

describe("fitsInSingleDay", () => {
  it("accepts a block that stays within the day", () => {
    expect(fitsInSingleDay(0, 2)).toBe(true)
    expect(fitsInSingleDay(15, 2)).toBe(true)
  })

  it("rejects a block that would spill into the next day", () => {
    // Row 16 is Monday 22:00, the last slot of that day.
    expect(fitsInSingleDay(16, 2)).toBe(false)
  })

  it("rejects a block running past the end of the week", () => {
    expect(fitsInSingleDay(ROW_COUNT - 1, 2)).toBe(false)
  })

  it("accepts a single-slot block anywhere", () => {
    expect(fitsInSingleDay(16, 1)).toBe(true)
    expect(fitsInSingleDay(ROW_COUNT - 1, 1)).toBe(true)
  })
})

describe("createGrid", () => {
  it("builds one row per weekly slot and one column per classroom", () => {
    const { matrix } = createGrid(3)

    expect(matrix).toHaveLength(ROW_COUNT)
    expect(matrix[0]).toHaveLength(3)
  })

  it("starts completely empty", () => {
    const { matrix, free } = createGrid(2)

    expect(matrix.every((row) => row.every((cell) => cell === null))).toBe(true)
    expect(free).toHaveLength(ROW_COUNT * 2)
  })

  it("lists every cell as free, ordered by row then column", () => {
    const { free } = createGrid(2)

    expect(free.slice(0, 3)).toEqual([
      { row: 0, classroom: 0 },
      { row: 0, classroom: 1 },
      { row: 1, classroom: 0 },
    ])
  })

  it("handles having no classrooms at all", () => {
    const { matrix, free } = createGrid(0)

    expect(matrix).toHaveLength(ROW_COUNT)
    expect(free).toEqual([])
  })

  it("does not share row arrays between rows", () => {
    const { matrix } = createGrid(2)
    matrix[0][0] = 7

    expect(matrix[1][0]).toBeNull()
  })
})
