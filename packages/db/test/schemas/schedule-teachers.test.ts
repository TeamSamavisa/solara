import {
  createScheduleTeacherSchema,
  listScheduleTeachersQuerySchema,
  updateScheduleTeacherSchema,
} from "@/schemas/schedule-teachers"

describe("createScheduleTeacherSchema", () => {
  it("accepts a valid association", () => {
    expect(
      createScheduleTeacherSchema.parse({ schedule_id: 3, teacher_id: 8 }),
    ).toEqual({ schedule_id: 3, teacher_id: 8 })
  })

  it("rejects a non positive schedule id", () => {
    const result = createScheduleTeacherSchema.safeParse({
      schedule_id: 0,
      teacher_id: 8,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "Selecione um horário.",
    )
  })

  it("rejects a non positive teacher id", () => {
    const result = createScheduleTeacherSchema.safeParse({
      schedule_id: 3,
      teacher_id: -1,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "Selecione um professor.",
    )
  })

  it("requires both ids", () => {
    expect(
      createScheduleTeacherSchema.safeParse({ schedule_id: 3 }).success,
    ).toBe(false)
    expect(
      createScheduleTeacherSchema.safeParse({ teacher_id: 3 }).success,
    ).toBe(false)
  })
})

describe("updateScheduleTeacherSchema", () => {
  it("accepts an empty payload", () => {
    expect(updateScheduleTeacherSchema.parse({})).toEqual({})
  })

  it("accepts moving the association to another schedule", () => {
    expect(updateScheduleTeacherSchema.parse({ schedule_id: 4 })).toEqual({
      schedule_id: 4,
    })
  })
})

describe("listScheduleTeachersQuerySchema", () => {
  it("applies the pagination defaults", () => {
    expect(listScheduleTeachersQuerySchema.parse({})).toEqual({
      limit: 10,
      page: 1,
    })
  })

  it("coerces both id filters", () => {
    expect(
      listScheduleTeachersQuerySchema.parse({
        schedule_id: "2",
        teacher_id: "9",
      }),
    ).toEqual({ limit: 10, page: 1, schedule_id: 2, teacher_id: 9 })
  })
})
