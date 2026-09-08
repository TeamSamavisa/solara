import { countHardViolations, emptySpaceCost, hardConstraintsCost } from "@/timetable/costs"
import { createGrid } from "@/timetable/grid"
import { prepareTimetable } from "@/timetable/model"
import { buildInput } from "@test/support/timetable"

describe("emptySpaceCost", () => {
  it("is zero when there is nothing scheduled", () => {
    expect(emptySpaceCost(new Map())).toEqual({
      total: 0,
      maxPerDay: 0,
      average: 0,
    })
  })

  it("is zero for consecutive slots", () => {
    expect(emptySpaceCost(new Map([[1, [0, 1, 2]]]))).toMatchObject({
      total: 0,
      maxPerDay: 0,
    })
  })

  it("counts the gap between two slots on the same day", () => {
    // 06:00 and 09:00 on Monday leave two empty hours between them.
    expect(emptySpaceCost(new Map([[1, [0, 3]]]))).toMatchObject({
      total: 2,
      maxPerDay: 2,
    })
  })

  it("ignores the gap across two different days", () => {
    // Row 16 is Monday 22:00 and row 17 is Tuesday 06:00.
    expect(emptySpaceCost(new Map([[1, [16, 17]]]))).toMatchObject({ total: 0 })
  })

  it("sums the gaps of several days but reports the worst single day", () => {
    // Monday: 0,3 -> 2 empty. Tuesday: 17,19 -> 1 empty.
    expect(emptySpaceCost(new Map([[1, [0, 3, 17, 19]]]))).toMatchObject({
      total: 3,
      maxPerDay: 2,
    })
  })

  it("averages over the entities, not over the days", () => {
    const cost = emptySpaceCost(
      new Map([
        [1, [0, 3]],
        [2, []],
      ]),
    )

    expect(cost.total).toBe(2)
    expect(cost.average).toBe(1)
  })

  it("does not depend on the order the slots arrive in", () => {
    expect(emptySpaceCost(new Map([[1, [3, 0]]])).total).toBe(2)
  })

  it("does not mutate the caller's arrays", () => {
    const times = [3, 0]
    emptySpaceCost(new Map([[1, times]]))

    expect(times).toEqual([3, 0])
  })

  it("tolerates a slot repeated by a conflict", () => {
    expect(emptySpaceCost(new Map([[1, [0, 0, 1]]])).total).toBe(0)
  })
})

describe("hardConstraintsCost", () => {
  function setup() {
    const prepared = prepareTimetable(buildInput())
    const { matrix } = createGrid(prepared.classrooms.length)

    return { prepared, matrix }
  }

  it("is zero for an empty timetable", () => {
    const { prepared, matrix } = setup()

    expect(hardConstraintsCost(matrix, prepared).total).toBe(0)
  })

  it("is zero for a valid placement", () => {
    const { prepared, matrix } = setup()
    // Row 1 is Monday 07:00, which schedule 200 covers for shift 1.
    matrix[1][0] = 0
    matrix[1][1] = 1

    expect(hardConstraintsCost(matrix, prepared).total).toBe(0)
  })

  it("charges a class placed in an incompatible room", () => {
    const input = buildInput()
    input.classrooms[1].space_type_id = 2
    const prepared = prepareTimetable(input)
    const { matrix } = createGrid(prepared.classrooms.length)
    matrix[1][1] = 0

    const cost = hardConstraintsCost(matrix, prepared)

    expect(cost.classroom).toBe(1)
    expect(cost.total).toBe(1)
    expect(cost.perAllocation[0]).toBe(1)
  })

  it("charges two classes sharing a teacher at the same hour", () => {
    const input = buildInput()
    input.class_allocations[1].teacher_id = 100
    const prepared = prepareTimetable(input)
    const { matrix } = createGrid(prepared.classrooms.length)
    matrix[1][0] = 0
    matrix[1][1] = 1

    const cost = hardConstraintsCost(matrix, prepared)

    expect(cost.teacher).toBe(1)
    expect(cost.group).toBe(0)
  })

  it("charges two classes of the same group at the same hour", () => {
    const input = buildInput()
    input.class_allocations[1].class_group_id = 30
    const prepared = prepareTimetable(input)
    const { matrix } = createGrid(prepared.classrooms.length)
    matrix[1][0] = 0
    matrix[1][1] = 1

    expect(hardConstraintsCost(matrix, prepared).group).toBe(1)
  })

  it("charges a class placed when its teacher is unavailable", () => {
    const input = buildInput()
    input.teacher_schedules["100"] = [202]
    const prepared = prepareTimetable(input)
    const { matrix } = createGrid(prepared.classrooms.length)
    matrix[1][0] = 0

    const cost = hardConstraintsCost(matrix, prepared)

    expect(cost.availability).toBe(1)
  })

  it("does not charge availability when the teacher declared none", () => {
    const input = buildInput()
    input.teacher_schedules = {}
    const prepared = prepareTimetable(input)
    const { matrix } = createGrid(prepared.classrooms.length)
    matrix[1][0] = 0

    expect(hardConstraintsCost(matrix, prepared).availability).toBe(0)
  })

  it("charges a row that carries no schedule at all", () => {
    const { prepared, matrix } = setup()
    // Row 0 is Monday 06:00, which no schedule covers.
    matrix[0][0] = 0

    expect(hardConstraintsCost(matrix, prepared).availability).toBe(1)
  })

  it("reports the cost per allocation so the worst can be mutated first", () => {
    const input = buildInput()
    input.class_allocations[1].teacher_id = 100
    const prepared = prepareTimetable(input)
    const { matrix } = createGrid(prepared.classrooms.length)
    matrix[1][0] = 0
    matrix[1][1] = 1

    const cost = hardConstraintsCost(matrix, prepared)

    // The conflict is charged to the allocation found first.
    expect(cost.perAllocation[0]).toBe(1)
    expect(cost.perAllocation).toHaveLength(2)
  })
})

describe("countHardViolations", () => {
  it("is zero for a valid placement", () => {
    const prepared = prepareTimetable(buildInput())
    const { matrix } = createGrid(prepared.classrooms.length)
    matrix[1][0] = 0
    matrix[1][1] = 1

    expect(countHardViolations(matrix, prepared)).toBe(0)
  })

  it("counts a conflict from both sides, unlike the per-allocation cost", () => {
    const input = buildInput()
    input.class_allocations[1].teacher_id = 100
    const prepared = prepareTimetable(input)
    const { matrix } = createGrid(prepared.classrooms.length)
    matrix[1][0] = 0
    matrix[1][1] = 1

    // Each of the two classes sees the other as a conflict.
    expect(countHardViolations(matrix, prepared)).toBe(2)
  })

  it("counts an incompatible room once per placed slot", () => {
    const input = buildInput()
    input.classrooms[1].space_type_id = 2
    const prepared = prepareTimetable(input)
    const { matrix } = createGrid(prepared.classrooms.length)
    matrix[1][1] = 0

    expect(countHardViolations(matrix, prepared)).toBe(1)
  })
})
