import {
  createScheduleSchema,
  listSchedulesQuerySchema,
  updateScheduleSchema,
} from "@/lib/db/schemas/schedules"

const validSchedule = {
  weekday: "Monday",
  start_time: "07:30",
  end_time: "09:10",
  shift_id: 1,
}

describe("createScheduleSchema", () => {
  it("accepts a valid schedule", () => {
    expect(createScheduleSchema.parse(validSchedule)).toEqual(validSchedule)
  })

  it("rejects an empty weekday", () => {
    const result = createScheduleSchema.safeParse({
      ...validSchedule,
      weekday: "",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Selecione o dia da semana.")
  })

  it.each(["7:30", "00:00", "23:59"])("accepts %s as a start time", (time) => {
    expect(
      createScheduleSchema.parse({ ...validSchedule, start_time: time })
        .start_time,
    ).toBe(time)
  })

  it.each(["24:00", "23:60", "7:5", "0730", "noon"])(
    "rejects %s as a start time",
    (time) => {
      const result = createScheduleSchema.safeParse({
        ...validSchedule,
        start_time: time,
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.message).toBe(
        "O horário de início deve estar no formato HH:MM.",
      )
    },
  )

  it("rejects a malformed end time with its own message", () => {
    const result = createScheduleSchema.safeParse({
      ...validSchedule,
      end_time: "25:00",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "O horário de término deve estar no formato HH:MM.",
    )
  })

  it("requires an integer shift id", () => {
    expect(
      createScheduleSchema.safeParse({ ...validSchedule, shift_id: 1.5 })
        .success,
    ).toBe(false)
    expect(
      createScheduleSchema.safeParse({ ...validSchedule, shift_id: "1" })
        .success,
    ).toBe(false)
  })
})

describe("updateScheduleSchema", () => {
  it("accepts an empty payload", () => {
    expect(updateScheduleSchema.parse({})).toEqual({})
  })

  it("accepts changing only the end time", () => {
    expect(updateScheduleSchema.parse({ end_time: "10:00" })).toEqual({
      end_time: "10:00",
    })
  })

  it("still validates the time format", () => {
    expect(updateScheduleSchema.safeParse({ end_time: "99:99" }).success).toBe(
      false,
    )
  })
})

describe("listSchedulesQuerySchema", () => {
  it("applies the pagination defaults", () => {
    expect(listSchedulesQuerySchema.parse({})).toEqual({ limit: 10, page: 1 })
  })

  it("accepts time filters in HH:mm", () => {
    expect(listSchedulesQuerySchema.parse({ start_time: "08:00" })).toEqual({
      limit: 10,
      page: 1,
      start_time: "08:00",
    })
  })

  it("rejects a malformed time filter", () => {
    expect(
      listSchedulesQuerySchema.safeParse({ start_time: "8h" }).success,
    ).toBe(false)
  })
})
