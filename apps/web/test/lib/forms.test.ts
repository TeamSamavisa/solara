import { z } from "zod"

import {
  readBoolean,
  readNumber,
  readNumberArray,
  readOptionalNumber,
  readOptionalString,
  readString,
  toFieldErrors,
} from "@/lib/forms"

function formData(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.append(key, value)
  return data
}

describe("toFieldErrors", () => {
  it("groups the messages by field", () => {
    const schema = z.object({
      name: z.string().min(1, { error: "obrigatório" }),
      age: z.number().int({ error: "inteiro" }),
    })
    const result = schema.safeParse({ name: "", age: 1.5 })

    expect(toFieldErrors(result.error!)).toEqual({
      name: ["obrigatório"],
      age: ["inteiro"],
    })
  })

  it("collects several messages for the same field", () => {
    const schema = z.object({
      password: z
        .string()
        .min(8, { error: "curta" })
        .regex(/\d/, { error: "sem número" }),
    })
    const result = schema.safeParse({ password: "abc" })

    expect(toFieldErrors(result.error!).password).toEqual(["curta", "sem número"])
  })

  it("returns an empty object when only the root failed", () => {
    const result = z.object({ a: z.string() }).safeParse("not an object")

    expect(toFieldErrors(result.error!)).toEqual({})
  })
})

describe("readString", () => {
  it("returns the raw value", () => {
    expect(readString(formData({ name: " Ana " }), "name")).toBe(" Ana ")
  })

  it("returns an empty string when the field is missing", () => {
    expect(readString(formData({}), "name")).toBe("")
  })
})

describe("readOptionalString", () => {
  it("trims the value", () => {
    expect(readOptionalString(formData({ name: "  Ana  " }), "name")).toBe("Ana")
  })

  it("turns blank fields into undefined", () => {
    expect(readOptionalString(formData({ name: "" }), "name")).toBeUndefined()
    expect(readOptionalString(formData({ name: "   " }), "name")).toBeUndefined()
    expect(readOptionalString(formData({}), "name")).toBeUndefined()
  })
})

describe("readNumber", () => {
  it("parses a numeric field", () => {
    expect(readNumber(formData({ n: "42" }), "n")).toBe(42)
  })

  it("yields NaN for a non numeric field so zod can reject it", () => {
    expect(readNumber(formData({ n: "abc" }), "n")).toBeNaN()
    expect(readNumber(formData({}), "n")).toBeNaN()
  })

  it("parses zero and negatives", () => {
    expect(readNumber(formData({ n: "0" }), "n")).toBe(0)
    expect(readNumber(formData({ n: "-3" }), "n")).toBe(-3)
  })
})

describe("readOptionalNumber", () => {
  it("returns undefined for a blank field", () => {
    expect(readOptionalNumber(formData({ n: "" }), "n")).toBeUndefined()
    expect(readOptionalNumber(formData({}), "n")).toBeUndefined()
  })

  it("parses a provided value, including zero", () => {
    expect(readOptionalNumber(formData({ n: "7" }), "n")).toBe(7)
    expect(readOptionalNumber(formData({ n: "0" }), "n")).toBe(0)
  })
})

describe("readBoolean", () => {
  it("is false when the checkbox was not submitted", () => {
    expect(readBoolean(formData({}), "blocked")).toBe(false)
  })

  it("is true for the default checkbox value", () => {
    expect(readBoolean(formData({ blocked: "on" }), "blocked")).toBe(true)
  })

  it("understands explicit true/false values", () => {
    expect(readBoolean(formData({ blocked: "true" }), "blocked")).toBe(true)
    expect(readBoolean(formData({ blocked: "false" }), "blocked")).toBe(false)
    expect(readBoolean(formData({ blocked: "0" }), "blocked")).toBe(false)
  })
})

describe("readNumberArray", () => {
  function multi(key: string, values: string[]): FormData {
    const data = new FormData()
    for (const value of values) data.append(key, value)
    return data
  }

  it("reads every checked value", () => {
    expect(readNumberArray(multi("schedule_ids", ["1", "4"]), "schedule_ids"))
      .toEqual([1, 4])
  })

  it("reads a single value", () => {
    expect(
      readNumberArray(multi("schedule_ids", ["7"]), "schedule_ids"),
    ).toEqual([7])
  })

  it("returns undefined when nothing was checked", () => {
    expect(readNumberArray(formData({}), "schedule_ids")).toBeUndefined()
  })

  it("ignores blank entries", () => {
    expect(
      readNumberArray(multi("schedule_ids", ["", "  ", "3"]), "schedule_ids"),
    ).toEqual([3])
  })

  it("returns undefined when every entry is blank", () => {
    expect(
      readNumberArray(multi("schedule_ids", ["", " "]), "schedule_ids"),
    ).toBeUndefined()
  })

  it("yields NaN for a non numeric entry so zod can reject it", () => {
    expect(
      readNumberArray(multi("schedule_ids", ["abc"]), "schedule_ids"),
    ).toEqual([Number.NaN])
  })
})
