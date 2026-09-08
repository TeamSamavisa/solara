import { createDatabaseSink, readTaskId } from "@/queue/sink"

const dbActions = {
  updateTaskProgress: jest.fn(),
  markTaskCompleted: jest.fn(),
  markTaskFailed: jest.fn(),
  applyOptimizedSchedule: jest.fn(),
}

jest.mock("@solara/db/actions/tasks", () => ({
  updateTaskProgress: (...args: unknown[]) => dbActions.updateTaskProgress(...args),
  markTaskCompleted: (...args: unknown[]) => dbActions.markTaskCompleted(...args),
  markTaskFailed: (...args: unknown[]) => dbActions.markTaskFailed(...args),
}))

jest.mock("@solara/db/actions/timetabling", () => ({
  applyOptimizedSchedule: (...args: unknown[]) =>
    dbActions.applyOptimizedSchedule(...args),
}))

beforeEach(() => {
  for (const mock of Object.values(dbActions)) mock.mockReset()
})

describe("readTaskId", () => {
  it("finds the task id in a raw job payload", () => {
    expect(readTaskId({ taskId: 7 })).toBe(7)
  })

  it("ignores payloads that are not objects", () => {
    expect(readTaskId(null)).toBeUndefined()
    expect(readTaskId("7")).toBeUndefined()
    expect(readTaskId(undefined)).toBeUndefined()
  })

  it("ignores a task id that is not a positive integer", () => {
    expect(readTaskId({ taskId: 0 })).toBeUndefined()
    expect(readTaskId({ taskId: -1 })).toBeUndefined()
    expect(readTaskId({ taskId: 1.5 })).toBeUndefined()
    expect(readTaskId({ taskId: "7" })).toBeUndefined()
  })
})

describe("createDatabaseSink", () => {
  it("forwards progress to the task row", async () => {
    const sink = createDatabaseSink()

    await sink.progress(7, 42)

    expect(dbActions.updateTaskProgress).toHaveBeenCalledWith(7, 42)
  })

  it("swallows a failed progress update", async () => {
    dbActions.updateTaskProgress.mockRejectedValue(new Error("db caiu"))
    const sink = createDatabaseSink()

    await expect(sink.progress(7, 42)).resolves.toBeUndefined()
  })

  it("persists the optimized entries", async () => {
    dbActions.applyOptimizedSchedule.mockResolvedValue({
      updated: 1,
      linkedSchedules: 2,
    })
    const sink = createDatabaseSink()
    const entries = [
      { allocation_id: 1, schedule_ids: [2, 3], classroom: { id: 4 } },
    ]

    await sink.persist(entries)

    expect(dbActions.applyOptimizedSchedule).toHaveBeenCalledWith(entries)
  })

  it("propagates a persistence failure, since the result would be lost", async () => {
    dbActions.applyOptimizedSchedule.mockRejectedValue(new Error("db caiu"))
    const sink = createDatabaseSink()

    await expect(sink.persist([])).rejects.toThrow("db caiu")
  })

  it("marks the task completed", async () => {
    const sink = createDatabaseSink()

    await sink.complete(7)

    expect(dbActions.markTaskCompleted).toHaveBeenCalledWith(7)
  })

  it("marks the task failed", async () => {
    const sink = createDatabaseSink()

    await sink.fail(7, "estourou")

    expect(dbActions.markTaskFailed).toHaveBeenCalledWith(7, "estourou")
  })

  it("swallows a failure while recording a failure", async () => {
    dbActions.markTaskFailed.mockRejectedValue(new Error("db caiu"))
    const sink = createDatabaseSink()

    await expect(sink.fail(7, "estourou")).resolves.toBeUndefined()
  })
})
