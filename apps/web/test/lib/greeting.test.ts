import { greetingFor } from "@/lib/greeting"

describe("greetingFor", () => {
  it.each([5, 8, 11])("greets the morning at %i", (hour) => {
    expect(greetingFor(hour)).toBe("Bom dia")
  })

  it.each([12, 15, 17])("greets the afternoon at %i", (hour) => {
    expect(greetingFor(hour)).toBe("Boa tarde")
  })

  it.each([18, 22, 23, 0, 4])("greets the evening at %i", (hour) => {
    expect(greetingFor(hour)).toBe("Boa noite")
  })

  it("switches exactly at the boundaries", () => {
    expect(greetingFor(4)).toBe("Boa noite")
    expect(greetingFor(5)).toBe("Bom dia")
    expect(greetingFor(11)).toBe("Bom dia")
    expect(greetingFor(12)).toBe("Boa tarde")
    expect(greetingFor(17)).toBe("Boa tarde")
    expect(greetingFor(18)).toBe("Boa noite")
  })
})
