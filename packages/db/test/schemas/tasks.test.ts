import {
  createTaskSchema,
  TASK_STATUSES,
  updateTaskSchema,
} from "@/schemas/tasks"

describe("createTaskSchema", () => {
  it("accepts a correlation id and a type", () => {
    expect(
      createTaskSchema.parse({
        correlation_id: "optimization-123",
        type: "TIMETABLE_OPTIMIZATION",
      }),
    ).toEqual({
      correlation_id: "optimization-123",
      type: "TIMETABLE_OPTIMIZATION",
    })
  })

  it("accepts an explicit status", () => {
    expect(
      createTaskSchema.parse({
        correlation_id: "abc",
        type: "TIMETABLE_OPTIMIZATION",
        status: "COMPLETED",
      }).status,
    ).toBe("COMPLETED")
  })

  it("rejects an empty correlation id", () => {
    expect(
      createTaskSchema.safeParse({
        correlation_id: "",
        type: "TIMETABLE_OPTIMIZATION",
      }).success,
    ).toBe(false)
  })

  it("rejects an unknown type", () => {
    expect(
      createTaskSchema.safeParse({ correlation_id: "a", type: "SOMETHING" })
        .success,
    ).toBe(false)
  })
})

describe("updateTaskSchema", () => {
  it("accepts an empty payload", () => {
    expect(updateTaskSchema.parse({})).toEqual({})
  })

  it.each(TASK_STATUSES)("accepts the %s status", (status) => {
    expect(updateTaskSchema.parse({ status }).status).toBe(status)
  })

  it("accepts the progress bounds", () => {
    expect(updateTaskSchema.parse({ progress: 0 }).progress).toBe(0)
    expect(updateTaskSchema.parse({ progress: 100 }).progress).toBe(100)
  })

  it("rejects progress outside 0..100", () => {
    expect(updateTaskSchema.safeParse({ progress: -1 }).success).toBe(false)
    expect(updateTaskSchema.safeParse({ progress: 101 }).success).toBe(false)
  })

  it("rejects a fractional progress", () => {
    expect(updateTaskSchema.safeParse({ progress: 50.5 }).success).toBe(false)
  })

  it("accepts an error message", () => {
    expect(updateTaskSchema.parse({ error_message: "boom" })).toEqual({
      error_message: "boom",
    })
  })
})
