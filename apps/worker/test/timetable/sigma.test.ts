import { adaptSigma, SIGMA_BOUNDS } from "@/timetable/optimize"

const WINDOW = 3

describe("adaptSigma", () => {
  it("grows the step when more than a fifth of the mutations worked", () => {
    expect(adaptSigma(1, 2, WINDOW)).toBeGreaterThan(1)
  })

  it("shrinks the step when they stopped working", () => {
    expect(adaptSigma(1, 0, WINDOW)).toBeLessThan(1)
  })

  it("treats a single success in three as progress", () => {
    // 1/3 is above the 1/5 threshold the rule is named after.
    expect(adaptSigma(1, 1, WINDOW)).toBeGreaterThan(1)
  })

  /**
   * The legacy compared the successes of a window of `n` against `2n`, which
   * no window can ever reach, so the step only ever shrank and the search went
   * inert after a few dozen iterations.
   */
  it("never decays to nothing, however long it stagnates", () => {
    let sigma = 2

    for (let i = 0; i < 500; i += 1) sigma = adaptSigma(sigma, 0, WINDOW)

    expect(sigma).toBe(SIGMA_BOUNDS.min)
    expect(sigma).toBeGreaterThan(0)
  })

  it("stays within a usable probability, however long it succeeds", () => {
    let sigma = 2

    for (let i = 0; i < 500; i += 1) sigma = adaptSigma(sigma, WINDOW, WINDOW)

    expect(sigma).toBe(SIGMA_BOUNDS.max)
  })

  it("keeps the floor above zero, so a mutation is always possible", () => {
    expect(SIGMA_BOUNDS.min).toBeGreaterThan(0)
  })

  it("can recover after bottoming out", () => {
    let sigma: number = SIGMA_BOUNDS.min

    for (let i = 0; i < 20; i += 1) sigma = adaptSigma(sigma, WINDOW, WINDOW)

    expect(sigma).toBeGreaterThan(SIGMA_BOUNDS.min)
  })
})
