import { createRandom } from "@/timetable/random"
import { shuffled } from "@/timetable/shuffle"

describe("shuffled", () => {
  it("keeps every element", () => {
    const items = [1, 2, 3, 4, 5]

    expect([...shuffled(items, createRandom(1))].sort()).toEqual(items)
  })

  it("leaves the input untouched", () => {
    const items = [1, 2, 3, 4, 5]

    shuffled(items, createRandom(1))

    expect(items).toEqual([1, 2, 3, 4, 5])
  })

  it("is reproducible for a given seed", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]

    expect(shuffled(items, createRandom(7))).toEqual(
      shuffled(items, createRandom(7)),
    )
  })

  it("gives a different order for a different seed", () => {
    const items = Array.from({ length: 30 }, (_, index) => index)

    expect(shuffled(items, createRandom(1))).not.toEqual(
      shuffled(items, createRandom(2)),
    )
  })

  it("actually reorders, instead of returning the input order", () => {
    const items = Array.from({ length: 30 }, (_, index) => index)

    expect(shuffled(items, createRandom(1))).not.toEqual(items)
  })

  it("copes with an empty list", () => {
    expect(shuffled([], createRandom(1))).toEqual([])
  })

  it("copes with a single element", () => {
    expect(shuffled([9], createRandom(1))).toEqual([9])
  })

  it("reaches the first position too", () => {
    // A shuffle that never moves index 0 is the classic off-by-one here.
    const seen = new Set<number>()

    for (let seed = 0; seed < 40; seed += 1) {
      seen.add(shuffled([0, 1, 2, 3], createRandom(seed))[0])
    }

    expect(seen.size).toBeGreaterThan(1)
  })
})
