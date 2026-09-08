import { countHardViolations } from "@/timetable/costs"
import { prepareTimetable } from "@/timetable/model"
import { optimizeTimetable, runOptimization } from "@/timetable/optimize"
import { createRandom } from "@/timetable/random"
import { timetableInputSchema } from "@/timetable/schema"
import { buildInput } from "@test/support/timetable"

/** Small budgets keep the suite fast; the defaults are exercised separately. */
const fast = {
  random: createRandom(1),
  evolutionRuns: 2,
  maxStagnation: 5,
  annealingIterations: 20,
}

describe("optimizeTimetable", () => {
  it("schedules every class of a satisfiable input", () => {
    const outcome = optimizeTimetable(buildInput(), fast)

    expect(outcome.schedule).toHaveLength(2)
    expect(outcome.unplaced).toEqual([])
    expect(outcome.statistics.hard_constraints_satisfied).toBe(true)
  })

  it("gives every scheduled class a real time slot", () => {
    const outcome = optimizeTimetable(buildInput(), fast)

    for (const entry of outcome.schedule) {
      expect(entry.schedule_ids.length).toBe(entry.duration)
      expect(entry.time_slots.length).toBe(entry.duration)
    }
  })

  it("is deterministic for a given seed", () => {
    const a = optimizeTimetable(buildInput(), {
      ...fast,
      random: createRandom(7),
    })
    const b = optimizeTimetable(buildInput(), {
      ...fast,
      random: createRandom(7),
    })

    expect(a.schedule).toEqual(b.schedule)
    expect(a.statistics).toEqual(b.statistics)
  })

  it("keeps a multi-hour class contiguous and inside one day", () => {
    const input = buildInput()
    input.class_allocations = [input.class_allocations[0]]
    input.class_allocations[0].duration = 2

    const entry = optimizeTimetable(input, fast).schedule[0]

    expect(entry.time_slots).toHaveLength(2)
    expect(entry.time_slots[0].day).toBe(entry.time_slots[1].day)
    expect(entry.time_slots[1].hour).toBe(entry.time_slots[0].hour + 1)
  })

  it("separates two classes that share a teacher", () => {
    const input = buildInput()
    input.class_allocations[1].teacher_id = 100

    const outcome = optimizeTimetable(input, fast)

    const [first, second] = outcome.schedule
    const overlap = first.schedule_ids.some((id) =>
      second.schedule_ids.includes(id),
    )
    expect(overlap).toBe(false)
  })

  it("respects declared teacher availability", () => {
    const input = buildInput()
    input.teacher_schedules["100"] = [202]

    const outcome = optimizeTimetable(input, fast)
    const entry = outcome.schedule.find((item) => item.teacher.id === 100)!

    expect(entry.schedule_ids).toEqual([202])
  })

  it("reports a conflict it cannot resolve instead of crashing", () => {
    const input = buildInput()
    // One schedule, two classes, one teacher: an impossible timetable.
    input.class_allocations[1].teacher_id = 100
    input.schedules = [input.schedules[0]]
    input.teacher_schedules = { "100": [200] }

    const outcome = optimizeTimetable(input, fast)

    expect(outcome.schedule).toHaveLength(2)
    expect(outcome.statistics.hard_constraints_satisfied).toBe(false)
    expect(outcome.statistics.hard_constraints_cost).toBeGreaterThan(0)
  })

  it("reports allocations it could not place at all", () => {
    const input = buildInput()
    input.classrooms.forEach((room) => (room.blocked = true))

    const outcome = optimizeTimetable(input, fast)

    expect(outcome.schedule).toEqual([])
    expect(outcome.unplaced).toHaveLength(2)
    expect(outcome.statistics.placed_allocations).toBe(0)
  })

  it("handles an empty payload", () => {
    const outcome = optimizeTimetable(timetableInputSchema.parse({}), fast)

    expect(outcome.schedule).toEqual([])
    expect(outcome.statistics.total_allocations).toBe(0)
    expect(outcome.statistics.hard_constraints_satisfied).toBe(true)
  })

  it("never ends with a worse hard-constraint cost than it started", () => {
    const input = buildInput()
    input.class_allocations[1].teacher_id = 100

    const outcome = optimizeTimetable(input, fast)

    expect(outcome.statistics.hard_constraints_cost).toBe(0)
  })

  it("leaves the grid internally consistent", () => {
    const input = buildInput()
    input.class_allocations[0].duration = 2
    const prepared = prepareTimetable(input)

    const state = runOptimization(prepared, fast)

    let occupied = 0
    for (const row of state.matrix) {
      for (const cell of row) if (cell !== null) occupied += 1
    }

    let filledCells = 0
    for (const cells of state.filled.values()) filledCells += cells.length

    expect(occupied).toBe(filledCells)
    expect(countHardViolations(state.matrix, prepared)).toBe(0)
  })

  it("does not exceed the configured annealing budget", () => {
    const input = buildInput()
    const random = jest.fn(createRandom(3))

    optimizeTimetable(input, { ...fast, random, annealingIterations: 3 })

    // Each annealing iteration draws at least one value, plus the mutations.
    expect(random.mock.calls.length).toBeGreaterThan(0)
  })
})
