import {
  createSpaceSchema,
  listSpacesQuerySchema,
  updateSpaceSchema,
} from "@/lib/db/schemas/spaces"

const validSpace = {
  name: "Lab 01",
  floor: 2,
  capacity: 40,
  blocked: false,
  space_type_id: 1,
}

describe("createSpaceSchema", () => {
  it("accepts a valid space", () => {
    expect(createSpaceSchema.parse(validSpace)).toEqual(validSpace)
  })

  it("accepts floor zero and negative floors, matching @IsInt", () => {
    expect(createSpaceSchema.parse({ ...validSpace, floor: 0 }).floor).toBe(0)
    expect(createSpaceSchema.parse({ ...validSpace, floor: -1 }).floor).toBe(-1)
  })

  it("rejects a fractional floor", () => {
    const result = createSpaceSchema.safeParse({ ...validSpace, floor: 1.5 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("O andar deve ser um número inteiro.")
  })

  it("rejects a capacity that is not positive", () => {
    const result = createSpaceSchema.safeParse({ ...validSpace, capacity: 0 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "A capacidade deve ser maior que zero.",
    )
  })

  it("requires blocked to be present and boolean", () => {
    const { blocked, ...withoutBlocked } = validSpace
    void blocked
    expect(createSpaceSchema.safeParse(withoutBlocked).success).toBe(false)
    expect(
      createSpaceSchema.safeParse({ ...validSpace, blocked: "false" }).success,
    ).toBe(false)
  })

  it("rejects an empty name", () => {
    const result = createSpaceSchema.safeParse({ ...validSpace, name: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Informe o nome do espaço.")
  })

  it("rejects a non positive space type id", () => {
    expect(
      createSpaceSchema.safeParse({ ...validSpace, space_type_id: -3 }).success,
    ).toBe(false)
  })
})

describe("updateSpaceSchema", () => {
  it("accepts an empty payload", () => {
    expect(updateSpaceSchema.parse({})).toEqual({})
  })

  it("accepts toggling only the blocked flag", () => {
    expect(updateSpaceSchema.parse({ blocked: true })).toEqual({
      blocked: true,
    })
  })

  it("validates the fields that are present", () => {
    expect(updateSpaceSchema.safeParse({ capacity: 0 }).success).toBe(false)
  })
})

describe("listSpacesQuerySchema", () => {
  it("applies the pagination defaults", () => {
    expect(listSpacesQuerySchema.parse({})).toEqual({ limit: 10, page: 1 })
  })

  it("coerces numeric filters from the query string", () => {
    expect(
      listSpacesQuerySchema.parse({ floor: "3", capacity: "20" }),
    ).toEqual({ limit: 10, page: 1, floor: 3, capacity: 20 })
  })

  it("allows filtering by floor zero", () => {
    expect(listSpacesQuerySchema.parse({ floor: "0" }).floor).toBe(0)
  })

  it("understands blocked=false instead of treating it as true", () => {
    expect(listSpacesQuerySchema.parse({ blocked: "false" }).blocked).toBe(
      false,
    )
    expect(listSpacesQuerySchema.parse({ blocked: "true" }).blocked).toBe(true)
  })

  it("leaves blocked undefined when it is not supplied", () => {
    expect(listSpacesQuerySchema.parse({}).blocked).toBeUndefined()
  })
})
