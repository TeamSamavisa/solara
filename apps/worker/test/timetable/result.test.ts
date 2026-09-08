import { prepareTimetable } from "@/timetable/model"
import { createState, placeInitial } from "@/timetable/placement"
import { buildResult } from "@/timetable/result"
import { buildInput } from "@test/support/timetable"

function setup(input = buildInput()) {
  const prepared = prepareTimetable(input)
  const state = createState(prepared)
  placeInitial(state, prepared)

  return { prepared, state }
}

describe("buildResult", () => {
  it("reports one entry per placed allocation", () => {
    const { prepared, state } = setup()
    const result = buildResult(state, prepared)

    expect(result.schedule).toHaveLength(2)
    expect(result.schedule.map((item) => item.allocation_id).sort()).toEqual([
      300, 301,
    ])
  })

  it("carries the identifiers the web app needs to persist the result", () => {
    const { prepared, state } = setup()
    const entry = buildResult(state, prepared).schedule[0]

    expect(entry.classroom).toMatchObject({ id: expect.any(Number) })
    expect(entry.schedule_ids.length).toBeGreaterThan(0)
    expect(entry.schedule_ids.every((id) => typeof id === "number")).toBe(true)
  })

  it("resolves the classroom by column, not by identifier", () => {
    const { prepared, state } = setup()
    const entry = buildResult(state, prepared).schedule[0]
    const column = state.filled.get(0)![0].classroom

    expect(entry.classroom.id).toBe(prepared.classrooms[column].id)
  })

  it("describes each occupied slot", () => {
    const input = buildInput()
    input.class_allocations = [input.class_allocations[0]]
    input.class_allocations[0].duration = 2
    const { prepared, state } = setup(input)

    const entry = buildResult(state, prepared).schedule[0]

    expect(entry.time_slots).toHaveLength(2)
    expect(entry.time_slots[0]).toMatchObject({
      day: expect.any(String),
      hour: expect.any(Number),
      schedule_id: expect.any(Number),
    })
  })

  it("only emits schedules belonging to the class group's shift", () => {
    const { prepared, state } = setup()
    const result = buildResult(state, prepared)

    for (const entry of result.schedule) {
      for (const scheduleId of entry.schedule_ids) {
        expect(prepared.schedules.get(scheduleId)?.shift_id).toBe(1)
      }
    }
  })

  it("reports statistics about the solution", () => {
    const { prepared, state } = setup()
    const stats = buildResult(state, prepared).statistics

    expect(stats).toMatchObject({
      hard_constraints_satisfied: true,
      hard_constraints_cost: 0,
      total_allocations: 2,
      placed_allocations: 2,
    })
    expect(stats.groups_empty_space).toMatchObject({
      total: expect.any(Number),
      max_per_day: expect.any(Number),
      average_per_week: expect.any(Number),
    })
  })

  it("flags an unsatisfied solution", () => {
    const input = buildInput()
    input.class_allocations[1].teacher_id = 100
    const prepared = prepareTimetable(input)
    const state = createState(prepared)
    // Force both classes onto the same row with the same teacher.
    state.matrix[1][0] = 0
    state.matrix[1][1] = 1
    state.filled.set(0, [{ row: 1, classroom: 0 }])
    state.filled.set(1, [{ row: 1, classroom: 1 }])

    const stats = buildResult(state, prepared).statistics

    expect(stats.hard_constraints_satisfied).toBe(false)
    expect(stats.hard_constraints_cost).toBeGreaterThan(0)
  })

  it("returns an empty schedule when nothing was placed", () => {
    const input = buildInput()
    input.class_allocations = []
    const { prepared, state } = setup(input)

    const result = buildResult(state, prepared)

    expect(result.schedule).toEqual([])
    expect(result.statistics.total_allocations).toBe(0)
  })

  it("skips an allocation whose rows carry no schedule for its shift", () => {
    const prepared = prepareTimetable(buildInput())
    const state = createState(prepared)
    // Row 0 is Monday 06:00, outside every declared schedule.
    state.matrix[0][0] = 0
    state.filled.set(0, [{ row: 0, classroom: 0 }])

    const entry = buildResult(state, prepared).schedule[0]

    expect(entry.schedule_ids).toEqual([])
    expect(entry.time_slots).toEqual([])
  })
})
