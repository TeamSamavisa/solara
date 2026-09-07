import {
  createCourseSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
} from "@/schemas/courses"

describe("createCourseSchema", () => {
  it("accepts a valid course", () => {
    expect(
      createCourseSchema.parse({ name: "Sistemas", course_type_id: 3 }),
    ).toEqual({ name: "Sistemas", course_type_id: 3 })
  })

  it("rejects an empty name", () => {
    const result = createCourseSchema.safeParse({
      name: "",
      course_type_id: 1,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Informe o nome do curso.")
  })

  it("rejects a course type id that is not positive", () => {
    const result = createCourseSchema.safeParse({
      name: "Sistemas",
      course_type_id: 0,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "Selecione um tipo de curso.",
    )
  })

  it("rejects a negative course type id", () => {
    expect(
      createCourseSchema.safeParse({ name: "S", course_type_id: -1 }).success,
    ).toBe(false)
  })

  it("rejects a fractional course type id", () => {
    expect(
      createCourseSchema.safeParse({ name: "S", course_type_id: 1.5 }).success,
    ).toBe(false)
  })

  it("rejects a numeric string, because request bodies were never coerced", () => {
    expect(
      createCourseSchema.safeParse({ name: "S", course_type_id: "3" }).success,
    ).toBe(false)
  })

  it("rejects a missing course type id", () => {
    expect(createCourseSchema.safeParse({ name: "S" }).success).toBe(false)
  })
})

describe("updateCourseSchema", () => {
  it("accepts an empty payload", () => {
    expect(updateCourseSchema.parse({})).toEqual({})
  })

  it("accepts a single field", () => {
    expect(updateCourseSchema.parse({ name: "Redes" })).toEqual({
      name: "Redes",
    })
    expect(updateCourseSchema.parse({ course_type_id: 2 })).toEqual({
      course_type_id: 2,
    })
  })

  it("validates the fields that are present", () => {
    expect(updateCourseSchema.safeParse({ name: "" }).success).toBe(false)
    expect(updateCourseSchema.safeParse({ course_type_id: 0 }).success).toBe(
      false,
    )
  })
})

describe("listCoursesQuerySchema", () => {
  it("applies the pagination defaults", () => {
    expect(listCoursesQuerySchema.parse({})).toEqual({ limit: 10, page: 1 })
  })

  it("coerces the course type id coming from the query string", () => {
    expect(listCoursesQuerySchema.parse({ course_type_id: "4" })).toEqual({
      limit: 10,
      page: 1,
      course_type_id: 4,
    })
  })

  it("rejects a non positive course type id filter", () => {
    expect(
      listCoursesQuerySchema.safeParse({ course_type_id: 0 }).success,
    ).toBe(false)
  })
})
