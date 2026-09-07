import {
  createClassGroupSchema,
  listClassGroupsQuerySchema,
  updateClassGroupSchema,
} from "@/lib/db/schemas/class-groups"

const validClassGroup = {
  name: "ADS 2024/1",
  semester: "2024.1",
  module: "3",
  student_count: 35,
  shift_id: 1,
  course_id: 2,
}

describe("createClassGroupSchema", () => {
  it("accepts a valid class group", () => {
    expect(createClassGroupSchema.parse(validClassGroup)).toEqual(
      validClassGroup,
    )
  })

  it.each([
    ["name", "Informe o nome da turma."],
    ["semester", "Informe o semestre."],
    ["module", "Informe o módulo."],
  ])("rejects an empty %s", (field, message) => {
    const result = createClassGroupSchema.safeParse({
      ...validClassGroup,
      [field]: "",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(message)
  })

  it("rejects a student count of zero", () => {
    const result = createClassGroupSchema.safeParse({
      ...validClassGroup,
      student_count: 0,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "O número de alunos deve ser maior que zero.",
    )
  })

  it("keeps module as a string even when it looks numeric", () => {
    expect(
      createClassGroupSchema.parse({ ...validClassGroup, module: "1" }).module,
    ).toBe("1")
    expect(
      createClassGroupSchema.safeParse({ ...validClassGroup, module: 1 })
        .success,
    ).toBe(false)
  })

  it("rejects non positive foreign keys", () => {
    expect(
      createClassGroupSchema.safeParse({ ...validClassGroup, shift_id: 0 })
        .success,
    ).toBe(false)
    expect(
      createClassGroupSchema.safeParse({ ...validClassGroup, course_id: 0 })
        .success,
    ).toBe(false)
  })
})

describe("updateClassGroupSchema", () => {
  it("accepts an empty payload", () => {
    expect(updateClassGroupSchema.parse({})).toEqual({})
  })

  it("accepts updating only the student count", () => {
    expect(updateClassGroupSchema.parse({ student_count: 12 })).toEqual({
      student_count: 12,
    })
  })
})

describe("listClassGroupsQuerySchema", () => {
  it("applies the pagination defaults", () => {
    expect(listClassGroupsQuerySchema.parse({})).toEqual({ limit: 10, page: 1 })
  })

  it("accepts the full filter set", () => {
    expect(
      listClassGroupsQuerySchema.parse({
        name: "ADS",
        semester: "2024.1",
        module: "3",
        student_count: "35",
        shift_id: "1",
        course_id: "2",
        page: "2",
      }),
    ).toEqual({
      limit: 10,
      page: 2,
      name: "ADS",
      semester: "2024.1",
      module: "3",
      student_count: 35,
      shift_id: 1,
      course_id: 2,
    })
  })
})
