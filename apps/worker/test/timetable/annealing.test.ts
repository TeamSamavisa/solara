import { emptySpaceCost, hardConstraintsCost } from "@/timetable/costs"
import { prepareTimetable } from "@/timetable/model"
import { mutationBatchSize, runAnnealing } from "@/timetable/optimize"
import { createState, placeInitial } from "@/timetable/placement"
import { createRandom } from "@/timetable/random"
import { buildLargeInput } from "@test/support/large-timetable"
import { buildInput } from "@test/support/timetable"

function solvedState(seed: number) {
  const prepared = prepareTimetable(buildLargeInput())
  const state = createState(prepared)

  placeInitial(state, prepared, createRandom(seed))

  return { state, prepared }
}

/**
 * Plain simulated annealing keeps whatever it last accepted, so a run that
 * wanders uphill late can hand back a timetable worse than the one it was
 * given. Neither the original nor the legacy service guarded against it; a
 * real run was observed going from no gaps at all to 0.12 average.
 */
describe("annealing never regresses", () => {
  for (const seed of [1, 2, 3, 7, 11]) {
    it(`keeps the best timetable it saw (seed ${seed})`, () => {
      const { state, prepared } = solvedState(seed)
      const before = emptySpaceCost(state.groupOccupancy).average

      runAnnealing(state, prepared, createRandom(seed), 200, () => {})

      expect(emptySpaceCost(state.groupOccupancy).average).toBeLessThanOrEqual(
        before,
      )
    })
  }

  it("never trades a hard constraint for a smaller gap", () => {
    const { state, prepared } = solvedState(3)
    const before = hardConstraintsCost(state.matrix, prepared).total

    runAnnealing(state, prepared, createRandom(3), 200, () => {})

    expect(hardConstraintsCost(state.matrix, prepared).total).toBeLessThanOrEqual(
      before,
    )
  })

  it("leaves an empty timetable alone", () => {
    const prepared = prepareTimetable({
      ...buildLargeInput(),
      class_allocations: [],
    })
    const state = createState(prepared)

    expect(() =>
      runAnnealing(state, prepared, createRandom(1), 50, () => {}),
    ).not.toThrow()
  })

  it("actually improves a gapped timetable, not just avoids regressing", () => {
    // The no-regression checks above would also pass on an annealing that
    // never mutates anything — this one requires real improvement. The state
    // is forced by hand because placeInitial never leaves a gap on its own.
    const input = buildInput()
    input.schedules.push({
      id: 204,
      weekday: "Monday",
      start_time: "09:00",
      end_time: "10:00",
      shift_id: 1,
    })
    input.teacher_schedules = {
      "100": [200, 201, 202, 203, 204],
      "101": [200, 201, 202, 203, 204],
    }
    // Both classes belong to the same group, so they share the occupancy map.
    input.class_allocations[1].class_group_id = 30
    const prepared = prepareTimetable(input)
    const state = createState(prepared)

    // Classes on rows 1 and 3 (07:00 and 09:00), row 2 free between them.
    state.matrix[1][0] = 0
    state.matrix[3][0] = 1
    state.filled.set(0, [{ row: 1, classroom: 0 }])
    state.filled.set(1, [{ row: 3, classroom: 0 }])
    state.free = state.free.filter(
      (cell) => !(cell.classroom === 0 && (cell.row === 1 || cell.row === 3)),
    )
    state.freeKeys = new Set(
      state.free.map((cell) => cell.row * state.columnCount + cell.classroom),
    )
    state.groupOccupancy.set(30, [1, 3])
    state.teacherOccupancy.set(100, [1])
    state.teacherOccupancy.set(101, [3])

    const before = emptySpaceCost(state.groupOccupancy).average
    expect(before).toBeGreaterThan(0)

    runAnnealing(state, prepared, createRandom(1), 50, () => {})

    expect(emptySpaceCost(state.groupOccupancy).average).toBeLessThan(before)
  })
})

describe("annealing budget", () => {
  it("runs exactly the configured number of iterations, no more, no less", () => {
    const prepared = prepareTimetable(buildInput())
    const state = createState(prepared)
    placeInitial(state, prepared, createRandom(1))
    const random = jest.fn(createRandom(3))

    runAnnealing(state, prepared, random, 7, () => {})

    // Each iteration draws one acceptance roll plus one pick per mutation.
    const drawsPerIteration =
      1 + mutationBatchSize(prepared.allocations.length)
    expect(random.mock.calls).toHaveLength(7 * drawsPerIteration)
  })
})
