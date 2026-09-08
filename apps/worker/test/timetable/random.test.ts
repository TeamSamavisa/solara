import { createRandom } from "@/timetable/random"

describe("createRandom", () => {
  it("produces values inside [0, 1)", () => {
    const random = createRandom(1)

    for (let i = 0; i < 200; i += 1) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it("is deterministic for a given seed", () => {
    const a = createRandom(42)
    const b = createRandom(42)

    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it("gives different streams for different seeds", () => {
    const a = createRandom(1)
    const b = createRandom(2)

    expect(a()).not.toBe(b())
  })

  it("does not immediately repeat itself", () => {
    const random = createRandom(7)
    const values = new Set(Array.from({ length: 50 }, () => random()))

    expect(values.size).toBe(50)
  })
})
