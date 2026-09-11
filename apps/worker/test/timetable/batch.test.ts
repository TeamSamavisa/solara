import { mutationBatchSize } from "@/timetable/optimize"

/**
 * The legacy service mutates a quarter of the timetable per annealing
 * iteration, rounding down — so a timetable with fewer than four classes was
 * never touched at all. This port keeps at least one.
 */
describe("mutationBatchSize", () => {
  it("is a quarter of the whole timetable", () => {
    expect(mutationBatchSize(289)).toBe(72)
  })

  it("rounds down, like the original", () => {
    expect(mutationBatchSize(11)).toBe(2)
  })

  it("still mutates something on a timetable smaller than four classes", () => {
    // The original rounded to zero here and left small timetables untouched.
    expect(mutationBatchSize(3)).toBe(1)
    expect(mutationBatchSize(1)).toBe(1)
  })

  it("never returns less than one", () => {
    expect(mutationBatchSize(0)).toBeGreaterThanOrEqual(1)
  })
})
