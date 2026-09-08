import { emptySpaceCost, hardConstraintsCost } from "@/timetable/costs"
import { prepareTimetable } from "@/timetable/model"
import { runAnnealing } from "@/timetable/optimize"
import { createState, placeInitial } from "@/timetable/placement"
import { createRandom } from "@/timetable/random"
import { buildLargeInput } from "@test/support/large-timetable"

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
})
