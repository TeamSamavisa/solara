import {
  baseQuerySchema,
  optionalBooleanFilter,
  TIME_PATTERN,
} from "@/schemas/common"

describe("baseQuerySchema", () => {
  it("applies the legacy defaults when nothing is supplied", () => {
    expect(baseQuerySchema.parse({})).toEqual({ limit: 10, page: 1 })
  })

  it("coerces the numeric strings that arrive from a query string", () => {
    expect(baseQuerySchema.parse({ limit: "25", page: "3" })).toEqual({
      limit: 25,
      page: 3,
    })
  })

  it("accepts the boundary values", () => {
    expect(baseQuerySchema.parse({ limit: 1, page: 1 }).limit).toBe(1)
    expect(baseQuerySchema.parse({ limit: 100 }).limit).toBe(100)
  })

  it("rejects a limit above 100", () => {
    expect(baseQuerySchema.safeParse({ limit: 101 }).success).toBe(false)
  })

  it("rejects a limit below 1", () => {
    expect(baseQuerySchema.safeParse({ limit: 0 }).success).toBe(false)
    expect(baseQuerySchema.safeParse({ limit: -5 }).success).toBe(false)
  })

  it("rejects a page below 1", () => {
    expect(baseQuerySchema.safeParse({ page: 0 }).success).toBe(false)
  })

  it("rejects non integer values", () => {
    expect(baseQuerySchema.safeParse({ limit: 10.5 }).success).toBe(false)
    expect(baseQuerySchema.safeParse({ page: 1.2 }).success).toBe(false)
  })

  it("rejects values that cannot be coerced into a number", () => {
    expect(baseQuerySchema.safeParse({ limit: "abc" }).success).toBe(false)
  })
})

describe("optionalBooleanFilter", () => {
  it.each([
    [true, true],
    [false, false],
    ["true", true],
    ["false", false],
    ["1", true],
    ["0", false],
  ])("parses %p as %p", (input, expected) => {
    expect(optionalBooleanFilter.parse(input)).toBe(expected)
  })

  it("stays undefined when omitted", () => {
    expect(optionalBooleanFilter.parse(undefined)).toBeUndefined()
  })

  it("rejects strings that are not booleanish", () => {
    expect(optionalBooleanFilter.safeParse("maybe").success).toBe(false)
  })
})

describe("TIME_PATTERN", () => {
  it.each(["00:00", "7:30", "07:30", "13:45", "23:59"])(
    "accepts %s",
    (value) => {
      expect(TIME_PATTERN.test(value)).toBe(true)
    },
  )

  it.each(["24:00", "23:60", "7:5", "0730", "abc", "", "12:345"])(
    "rejects %s",
    (value) => {
      expect(TIME_PATTERN.test(value)).toBe(false)
    },
  )
})
