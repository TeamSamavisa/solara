import {
  createAssignmentSchema,
  listAssignmentsQuerySchema,
  updateAssignmentSchema,
} from "@/schemas/assignments"

const validAssignment = {
  teacher_id: 1,
  subject_id: 2,
  class_group_id: 3,
}

describe("createAssignmentSchema", () => {
  it("accepts the minimum payload", () => {
    expect(createAssignmentSchema.parse(validAssignment)).toEqual(
      validAssignment,
    )
  })

  it("accepts the optional fields", () => {
    const input = {
      ...validAssignment,
      space_id: 4,
      duration: 3,
      schedule_ids: [1, 2],
    }
    expect(createAssignmentSchema.parse(input)).toEqual(input)
  })

  it("leaves duration undefined so the action can apply the default", () => {
    expect(createAssignmentSchema.parse(validAssignment).duration).toBeUndefined()
  })

  it.each([
    ["teacher_id", "Selecione um professor."],
    ["subject_id", "Selecione uma disciplina."],
    ["class_group_id", "Selecione uma turma."],
  ])("rejects a non positive %s", (field, message) => {
    const result = createAssignmentSchema.safeParse({
      ...validAssignment,
      [field]: 0,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(message)
  })

  it("rejects a non positive space id when supplied", () => {
    const result = createAssignmentSchema.safeParse({
      ...validAssignment,
      space_id: 0,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "Selecione um espaço.",
    )
  })

  it("rejects an empty schedule_ids array", () => {
    const result = createAssignmentSchema.safeParse({
      ...validAssignment,
      schedule_ids: [],
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "Selecione ao menos um horário.",
    )
  })

  it("rejects a schedule id that is not positive", () => {
    const result = createAssignmentSchema.safeParse({
      ...validAssignment,
      schedule_ids: [1, 0],
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "Horário inválido.",
    )
  })

  it("rejects a non array schedule_ids", () => {
    expect(
      createAssignmentSchema.safeParse({
        ...validAssignment,
        schedule_ids: 3,
      }).success,
    ).toBe(false)
  })

  it("rejects a non positive duration", () => {
    const result = createAssignmentSchema.safeParse({
      ...validAssignment,
      duration: 0,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "A duração deve ser maior que zero.",
    )
  })
})

describe("updateAssignmentSchema", () => {
  it("accepts an empty payload", () => {
    expect(updateAssignmentSchema.parse({})).toEqual({})
  })

  it("accepts replacing only the schedules", () => {
    expect(updateAssignmentSchema.parse({ schedule_ids: [5] })).toEqual({
      schedule_ids: [5],
    })
  })

  it("still rejects an empty schedule list", () => {
    expect(
      updateAssignmentSchema.safeParse({ schedule_ids: [] }).success,
    ).toBe(false)
  })
})

describe("listAssignmentsQuerySchema", () => {
  it("applies the pagination defaults", () => {
    expect(listAssignmentsQuerySchema.parse({})).toEqual({ limit: 10, page: 1 })
  })

  it("coerces every id filter", () => {
    expect(
      listAssignmentsQuerySchema.parse({
        schedule_id: "1",
        teacher_id: "2",
        subject_id: "3",
        space_id: "4",
        class_group_id: "5",
      }),
    ).toEqual({
      limit: 10,
      page: 1,
      schedule_id: 1,
      teacher_id: 2,
      subject_id: 3,
      space_id: 4,
      class_group_id: 5,
    })
  })
})
