import {
  createSubjectSchema,
  listSubjectsQuerySchema,
  updateSubjectSchema,
} from "@/lib/db/schemas/subjects"

const validSubject = {
  name: "Banco de Dados",
  required_space_type_id: 2,
  course_id: 5,
}

describe("createSubjectSchema", () => {
  it("accepts a valid subject", () => {
    expect(createSubjectSchema.parse(validSubject)).toEqual(validSubject)
  })

  it("rejects an empty name", () => {
    const result = createSubjectSchema.safeParse({ ...validSubject, name: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Informe o nome da disciplina.")
  })

  it("rejects a non positive required space type id", () => {
    const result = createSubjectSchema.safeParse({
      ...validSubject,
      required_space_type_id: 0,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "Selecione um tipo de espaço.",
    )
  })

  it("rejects a non positive course id", () => {
    const result = createSubjectSchema.safeParse({
      ...validSubject,
      course_id: -2,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "Selecione um curso.",
    )
  })

  it("reports every invalid field at once", () => {
    const result = createSubjectSchema.safeParse({
      name: "",
      required_space_type_id: 0,
      course_id: 0,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(3)
  })
})

describe("updateSubjectSchema", () => {
  it("accepts an empty payload", () => {
    expect(updateSubjectSchema.parse({})).toEqual({})
  })

  it("accepts a partial payload", () => {
    expect(updateSubjectSchema.parse({ course_id: 9 })).toEqual({
      course_id: 9,
    })
  })
})

describe("listSubjectsQuerySchema", () => {
  it("applies the pagination defaults", () => {
    expect(listSubjectsQuerySchema.parse({})).toEqual({ limit: 10, page: 1 })
  })

  it("coerces the id filters", () => {
    expect(
      listSubjectsQuerySchema.parse({
        required_space_type_id: "3",
        course_id: "7",
      }),
    ).toEqual({
      limit: 10,
      page: 1,
      required_space_type_id: 3,
      course_id: 7,
    })
  })
})
