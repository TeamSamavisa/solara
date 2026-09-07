import { buildHref, firstParam } from "@/lib/search-params"

describe("buildHref", () => {
  it("returns the bare path when there is nothing to carry", () => {
    expect(buildHref("/shifts", {})).toBe("/shifts")
  })

  it("keeps the existing filters", () => {
    expect(buildHref("/shifts", { name: "Matutino", limit: "25" })).toBe(
      "/shifts?name=Matutino&limit=25",
    )
  })

  it("overrides a single key while keeping the rest", () => {
    expect(
      buildHref("/shifts", { name: "Matutino", page: "1" }, { page: 3 }),
    ).toBe("/shifts?name=Matutino&page=3")
  })

  it("drops a key when the override is undefined", () => {
    expect(buildHref("/shifts", { name: "X", page: "3" }, { page: undefined })).toBe(
      "/shifts?name=X",
    )
  })

  it("drops empty values instead of leaving them in the URL", () => {
    expect(buildHref("/shifts", { name: "", page: "2" })).toBe("/shifts?page=2")
    expect(buildHref("/shifts", { page: "2" }, { name: "" })).toBe(
      "/shifts?page=2",
    )
  })

  it("ignores undefined values", () => {
    expect(buildHref("/shifts", { name: undefined, page: "2" })).toBe(
      "/shifts?page=2",
    )
  })

  it("uses the first value of a repeated param", () => {
    expect(buildHref("/shifts", { name: ["a", "b"] })).toBe("/shifts?name=a")
  })

  it("encodes special characters", () => {
    expect(buildHref("/shifts", { name: "Manhã & Tarde" })).toBe(
      "/shifts?name=Manh%C3%A3+%26+Tarde",
    )
  })
})

describe("firstParam", () => {
  it("reads a plain value", () => {
    expect(firstParam({ name: "Matutino" }, "name")).toBe("Matutino")
  })

  it("reads the first of a repeated value", () => {
    expect(firstParam({ name: ["a", "b"] }, "name")).toBe("a")
  })

  it("returns undefined for missing or empty values", () => {
    expect(firstParam({}, "name")).toBeUndefined()
    expect(firstParam({ name: "" }, "name")).toBeUndefined()
    expect(firstParam({ name: undefined }, "name")).toBeUndefined()
  })
})
