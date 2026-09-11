import { prepareTimetable } from "@/timetable/model"
import { canPlaceAtRow, createState, mutateIdealSpot, placeInitial } from "@/timetable/placement"
import { buildInput } from "@test/support/timetable"

function setup(input = buildInput()) {
  const prepared = prepareTimetable(input)
  const state = createState(prepared)

  return { prepared, state }
}

describe("createState", () => {
  it("starts with an empty grid sized to the classrooms", () => {
    const { prepared, state } = setup()

    expect(state.matrix[0]).toHaveLength(prepared.classrooms.length)
    expect(state.filled.size).toBe(0)
  })

  it("tracks every class group and teacher, even before anything is placed", () => {
    const { state } = setup()

    expect([...state.groupOccupancy.keys()].sort()).toEqual([30, 31])
    expect([...state.teacherOccupancy.keys()].sort()).toEqual([100, 101])
  })
})

describe("canPlaceAtRow", () => {
  it("accepts a row covered by a schedule of the group's shift", () => {
    const { prepared, state } = setup()

    // Row 1 is Monday 07:00, covered by schedule 200 on shift 1.
    expect(canPlaceAtRow(state, prepared, 0, 1)).toBe(true)
  })

  it("rejects a row with no schedule at all", () => {
    const { prepared, state } = setup()

    // Row 0 is Monday 06:00, which no schedule covers.
    expect(canPlaceAtRow(state, prepared, 0, 0)).toBe(false)
  })

  it("rejects a row whose schedule belongs to another shift", () => {
    const input = buildInput()
    input.shifts.push({ id: 2, name: "Noturno" })
    // The group of allocation 0 moves to a shift with no schedules at all.
    input.class_groups[0].shift_id = 2
    const { prepared, state } = setup(input)

    expect(canPlaceAtRow(state, prepared, 0, 1)).toBe(false)
    // The other group still belongs to the shift that owns row 1.
    expect(canPlaceAtRow(state, prepared, 1, 1)).toBe(true)
  })

  it("rejects a row where the teacher is unavailable", () => {
    const input = buildInput()
    input.teacher_schedules["100"] = [202]
    const { prepared, state } = setup(input)

    expect(canPlaceAtRow(state, prepared, 0, 1)).toBe(false)
  })

  it("accepts any scheduled row when the teacher declared no availability", () => {
    const input = buildInput()
    input.teacher_schedules = {}
    const { prepared, state } = setup(input)

    expect(canPlaceAtRow(state, prepared, 0, 1)).toBe(true)
  })

  it("rejects a row already taken by the same teacher", () => {
    const input = buildInput()
    input.class_allocations[1].teacher_id = 100
    const { prepared, state } = setup(input)
    state.matrix[1][0] = 1

    expect(canPlaceAtRow(state, prepared, 0, 1)).toBe(false)
  })

  it("rejects a row already taken by the same class group", () => {
    const input = buildInput()
    input.class_allocations[1].class_group_id = 30
    const { prepared, state } = setup(input)
    state.matrix[1][0] = 1

    expect(canPlaceAtRow(state, prepared, 0, 1)).toBe(false)
  })

  it("accepts a row taken by an unrelated class", () => {
    const { prepared, state } = setup()
    state.matrix[1][0] = 1

    expect(canPlaceAtRow(state, prepared, 0, 1)).toBe(true)
  })
})

describe("placeInitial", () => {
  it("places every allocation when there is room", () => {
    const { prepared, state } = setup()
    const result = placeInitial(state, prepared)

    expect(result.placed).toBe(2)
    expect(result.failed).toEqual([])
    expect(state.filled.size).toBe(2)
  })

  it("writes the allocation index into the matrix", () => {
    const { prepared, state } = setup()
    placeInitial(state, prepared)

    const cells = state.filled.get(0)!
    expect(state.matrix[cells[0].row][cells[0].classroom]).toBe(0)
  })

  it("only uses rows that carry a schedule", () => {
    const { prepared, state } = setup()
    placeInitial(state, prepared)

    for (const cells of state.filled.values()) {
      for (const cell of cells) {
        expect(prepared.scheduleByRow.has(cell.row)).toBe(true)
      }
    }
  })

  it("keeps a multi-hour class inside a single day", () => {
    const input = buildInput()
    input.class_allocations = [input.class_allocations[0]]
    input.class_allocations[0].duration = 2
    const { prepared, state } = setup(input)

    placeInitial(state, prepared)
    const cells = state.filled.get(0)!

    expect(cells).toHaveLength(2)
    expect(cells[1].row).toBe(cells[0].row + 1)
    expect(Math.floor(cells[0].row / 17)).toBe(Math.floor(cells[1].row / 17))
  })

  it("places a class even when it must overlap, so nothing is lost", () => {
    const input = buildInput()
    // Both classes share a teacher and only one schedule exists.
    input.class_allocations[1].teacher_id = 100
    input.schedules = [input.schedules[0]]
    input.teacher_schedules = { "100": [200] }
    const { prepared, state } = setup(input)

    const result = placeInitial(state, prepared)

    expect(result.placed).toBe(2)
    expect(result.failed).toEqual([])
  })

  it("reports an allocation it could not place", () => {
    const input = buildInput()
    // No compatible room for the first subject.
    input.classrooms.forEach((room) => (room.blocked = true))
    const { prepared, state } = setup(input)

    const result = placeInitial(state, prepared)

    expect(result.placed).toBe(0)
    expect(result.failed).toHaveLength(2)
    expect(result.failed[0]).toMatchObject({ subject: "Banco de Dados" })
  })

  it("removes the used cells from the free list", () => {
    const { prepared, state } = setup()
    const before = state.free.length
    placeInitial(state, prepared)

    expect(state.free.length).toBe(before - 2)
  })

  it("removes exactly the occupied cells — not some other ones", () => {
    const { prepared, state } = setup()
    placeInitial(state, prepared)

    // A wrong comparison in takeCell would still remove *a* cell, keeping the
    // count right while leaving an occupied cell looking free.
    for (const cells of state.filled.values()) {
      for (const cell of cells) {
        const stillListed = state.free.some(
          (candidate) =>
            candidate.row === cell.row &&
            candidate.classroom === cell.classroom,
        )
        expect(stillListed).toBe(false)
      }
    }
  })

  it("records the occupied rows for group and teacher", () => {
    const { prepared, state } = setup()
    placeInitial(state, prepared)

    expect(state.groupOccupancy.get(30)).toHaveLength(1)
    expect(state.teacherOccupancy.get(100)).toHaveLength(1)
  })

  it("does nothing when there is nothing to place", () => {
    const input = buildInput()
    input.class_allocations = []
    const { prepared, state } = setup(input)

    expect(placeInitial(state, prepared)).toEqual({ placed: 0, failed: [] })
  })
})

describe("mutateIdealSpot", () => {
  it("leaves an unplaced allocation alone", () => {
    const { prepared, state } = setup()

    expect(mutateIdealSpot(state, prepared, 0)).toBe(false)
  })

  it("moves a conflicting class to a free, valid spot", () => {
    const input = buildInput()
    input.class_allocations[1].teacher_id = 100
    const { prepared, state } = setup(input)

    // Force both classes onto the same row, sharing a teacher. Row 1 is
    // Monday 07:00, covered by schedule 200.
    state.matrix[1][0] = 0
    state.matrix[1][1] = 1
    state.filled.set(0, [{ row: 1, classroom: 0 }])
    state.filled.set(1, [{ row: 1, classroom: 1 }])
    state.free = state.free.filter((cell) => cell.row !== 1)
    state.freeKeys = new Set(
      state.free.map((cell) => cell.row * state.columnCount + cell.classroom),
    )

    expect(mutateIdealSpot(state, prepared, 0)).toBe(true)

    const moved = state.filled.get(0)!
    expect(moved[0].row).not.toBe(1)
    expect(state.matrix[moved[0].row][moved[0].classroom]).toBe(0)
    // The other class is left where it was.
    expect(state.filled.get(1)).toEqual([{ row: 1, classroom: 1 }])
    expect(state.matrix[1][0]).toBeNull()
  })

  it("never moves a class into a room its subject cannot use", () => {
    const input = buildInput()
    // The subject of allocation 0 requires a lab; only classroom 11
    // (index 1) is one, so the first free cell is not good enough.
    input.subjects[0].required_space_type_id = 2
    input.classrooms[1].space_type_id = 2
    input.class_allocations[1].teacher_id = 100
    const { prepared, state } = setup(input)

    // Both on Monday 07:00 (row 1), sharing a teacher: allocation 0 must
    // move, and the first free cells belong to the incompatible room.
    state.matrix[1][1] = 0
    state.matrix[1][0] = 1
    state.filled.set(0, [{ row: 1, classroom: 1 }])
    state.filled.set(1, [{ row: 1, classroom: 0 }])
    state.free = state.free.filter((cell) => cell.row !== 1)
    state.freeKeys = new Set(
      state.free.map((cell) => cell.row * state.columnCount + cell.classroom),
    )

    expect(mutateIdealSpot(state, prepared, 0)).toBe(true)

    const moved = state.filled.get(0)!
    expect(moved[0].row).not.toBe(1)
    expect(moved[0].classroom).toBe(1)
  })

  it("keeps the grid consistent after a move", () => {
    const { prepared, state } = setup()
    placeInitial(state, prepared)
    mutateIdealSpot(state, prepared, 0)

    const cells = state.filled.get(0)!
    for (const cell of cells) {
      expect(state.matrix[cell.row][cell.classroom]).toBe(0)
    }
    // Every other matrix cell holding 0 must be one of those cells.
    let occurrences = 0
    for (const row of state.matrix) {
      for (const cell of row) if (cell === 0) occurrences += 1
    }
    expect(occurrences).toBe(cells.length)
  })

  it("does not leak cells between free and filled", () => {
    const { prepared, state } = setup()
    placeInitial(state, prepared)
    const totalCells = state.matrix.length * state.matrix[0].length
    mutateIdealSpot(state, prepared, 0)

    let filledCount = 0
    for (const cells of state.filled.values()) filledCount += cells.length

    expect(state.free.length + filledCount).toBe(totalCells)
  })
})
