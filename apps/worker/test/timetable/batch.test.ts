import { mutationBatchSize } from "@/timetable/optimize"

/**
 * The original sorts every class by cost, takes the first quarter of that
 * list and skips the zero-cost entries inside the window. Taking a quarter of
 * the *non-zero* entries instead — as this port first did — collapses to a
 * single mutation per iteration as soon as the timetable is nearly solved,
 * which is exactly when the remaining conflicts need the most attempts.
 */
describe("mutationBatchSize", () => {
  it("is a quarter of the whole timetable, not of what is still broken", () => {
    expect(mutationBatchSize(289)).toBe(72)
  })

  it("covers every conflict while few remain", () => {
    // 289 allocations with 4 conflicts: all 4 fall inside the window.
    expect(mutationBatchSize(289)).toBeGreaterThanOrEqual(4)
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
