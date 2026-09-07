import {
  buildWhere,
  filterEq,
  hasUpdates,
  pickDefined,
  requireFound,
} from "@/lib/db/actions/utils"
import { NotFoundError } from "@/lib/db/errors"
import { spaces } from "@/lib/db/schemas"

describe("filterEq", () => {
  it("builds a condition for a real value", () => {
    expect(filterEq(spaces.name, "Lab 01")).toBeDefined()
  })

  it("drops undefined, null and empty strings like the legacy buildWhere", () => {
    expect(filterEq(spaces.name, undefined)).toBeUndefined()
    expect(filterEq(spaces.name, null)).toBeUndefined()
    expect(filterEq(spaces.name, "")).toBeUndefined()
  })

  it("keeps zero, which is a meaningful floor number", () => {
    expect(filterEq(spaces.floor, 0)).toBeDefined()
  })

  it("keeps false, which is a meaningful blocked value", () => {
    expect(filterEq(spaces.blocked, false)).toBeDefined()
  })
})

describe("buildWhere", () => {
  it("returns undefined when nothing is filtered", () => {
    expect(buildWhere([undefined, undefined])).toBeUndefined()
    expect(buildWhere([])).toBeUndefined()
  })

  it("returns a condition when at least one filter applies", () => {
    expect(
      buildWhere([undefined, filterEq(spaces.name, "Lab")]),
    ).toBeDefined()
  })

  it("combines several filters", () => {
    expect(
      buildWhere([
        filterEq(spaces.name, "Lab"),
        filterEq(spaces.capacity, 30),
      ]),
    ).toBeDefined()
  })
})

describe("requireFound", () => {
  it("returns the row when it exists", () => {
    const row = { id: 1 }
    expect(requireFound(row, "nope")).toBe(row)
  })

  it("throws NotFoundError for undefined", () => {
    expect(() => requireFound(undefined, "Espaço não encontrado.")).toThrow(
      new NotFoundError("Espaço não encontrado."),
    )
  })

  it("throws NotFoundError for null", () => {
    expect(() => requireFound(null, "Espaço não encontrado.")).toThrow(NotFoundError)
  })

  it("does not treat falsy values as missing", () => {
    expect(requireFound(0, "nope")).toBe(0)
    expect(requireFound(false, "nope")).toBe(false)
  })
})

describe("pickDefined", () => {
  it("drops undefined values", () => {
    expect(pickDefined({ a: 1, b: undefined, c: "x" })).toEqual({
      a: 1,
      c: "x",
    })
  })

  it("keeps null and falsy values", () => {
    expect(pickDefined({ a: null, b: 0, c: false, d: "" })).toEqual({
      a: null,
      b: 0,
      c: false,
      d: "",
    })
  })

  it("returns an empty object when everything is undefined", () => {
    expect(pickDefined({ a: undefined })).toEqual({})
  })
})

describe("hasUpdates", () => {
  it("detects whether there is anything to write", () => {
    expect(hasUpdates({})).toBe(false)
    expect(hasUpdates({ name: "x" })).toBe(true)
  })
})
