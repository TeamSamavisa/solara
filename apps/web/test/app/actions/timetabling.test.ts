import {
  getOptimizationStatus,
  startOptimization,
} from "@/app/actions/timetabling"

const requireRole = jest.fn()
const enqueueOptimization = jest.fn()
const collectTimetableData = jest.fn()
const getAllocationStatistics = jest.fn()
const createTask = jest.fn()
const getLastTaskByType = jest.fn()
const markTaskFailed = jest.fn()
const revalidatePath = jest.fn()

jest.mock("@/lib/auth/dal", () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}))
jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}))
jest.mock("@solara/queue/producer", () => ({
  enqueueOptimization: (...args: unknown[]) => enqueueOptimization(...args),
}))
jest.mock("@solara/db/actions/timetabling", () => ({
  collectTimetableData: (...args: unknown[]) => collectTimetableData(...args),
  getAllocationStatistics: (...args: unknown[]) =>
    getAllocationStatistics(...args),
}))
jest.mock("@solara/db/actions/tasks", () => ({
  createTask: (...args: unknown[]) => createTask(...args),
  getLastTaskByType: (...args: unknown[]) => getLastTaskByType(...args),
  markTaskFailed: (...args: unknown[]) => markTaskFailed(...args),
}))

const runningTask = {
  id: 12,
  correlation_id: "abc",
  type: "TIMETABLE_OPTIMIZATION",
  status: "PROCESSING",
  progress: 40,
  error_message: null,
  created_at: new Date("2024-05-01T12:00:00Z"),
  updated_at: new Date("2024-05-01T12:00:10Z"),
}

beforeEach(() => {
  for (const mock of [
    requireRole,
    enqueueOptimization,
    collectTimetableData,
    getAllocationStatistics,
    createTask,
    getLastTaskByType,
    markTaskFailed,
    revalidatePath,
  ]) {
    mock.mockReset()
  }

  requireRole.mockResolvedValue({ userId: 1, role: "admin" })
  collectTimetableData.mockResolvedValue({ class_allocations: [{ id: 1 }] })
  createTask.mockResolvedValue(runningTask)
  enqueueOptimization.mockResolvedValue({ jobId: "1" })
  getLastTaskByType.mockResolvedValue(null)
  getAllocationStatistics.mockResolvedValue({
    total: 10,
    scheduled: 4,
    pending: 6,
  })
})

describe("startOptimization", () => {
  it("requires an administrator", async () => {
    await startOptimization(undefined, new FormData())

    expect(requireRole).toHaveBeenCalledWith("admin")
  })

  it("creates the task before enqueueing, so progress is visible at once", async () => {
    const order: string[] = []
    createTask.mockImplementation(async () => {
      order.push("task")
      return runningTask
    })
    enqueueOptimization.mockImplementation(async () => {
      order.push("enqueue")
      return { jobId: "1" }
    })

    await startOptimization(undefined, new FormData())

    expect(order).toEqual(["task", "enqueue"])
  })

  it("sends the collected data with the task and correlation ids", async () => {
    await startOptimization(undefined, new FormData())

    expect(enqueueOptimization).toHaveBeenCalledWith({
      correlationId: "abc",
      taskId: 12,
      data: { class_allocations: [{ id: 1 }] },
    })
  })

  it("reports success to the form", async () => {
    const state = await startOptimization(undefined, new FormData())

    expect(state.success).toBe(true)
  })

  it("refreshes the page so the new task shows up", async () => {
    await startOptimization(undefined, new FormData())

    expect(revalidatePath).toHaveBeenCalledWith("/assignments")
  })

  it("refuses to start when another run is still going", async () => {
    getLastTaskByType.mockResolvedValue(runningTask)

    const state = await startOptimization(undefined, new FormData())

    expect(state.success).toBeUndefined()
    expect(state.message).toMatch(/andamento/i)
    expect(createTask).not.toHaveBeenCalled()
    expect(enqueueOptimization).not.toHaveBeenCalled()
  })

  it("starts again once the previous run finished", async () => {
    getLastTaskByType.mockResolvedValue({
      ...runningTask,
      status: "COMPLETED",
    })

    const state = await startOptimization(undefined, new FormData())

    expect(state.success).toBe(true)
  })

  it("refuses to start when there is nothing to schedule", async () => {
    collectTimetableData.mockResolvedValue({ class_allocations: [] })

    const state = await startOptimization(undefined, new FormData())

    expect(state.message).toMatch(/nenhuma alocação/i)
    expect(enqueueOptimization).not.toHaveBeenCalled()
  })

  it("fails the task it just created when the queue is unreachable", async () => {
    enqueueOptimization.mockRejectedValue(new Error("ECONNREFUSED"))

    const state = await startOptimization(undefined, new FormData())

    expect(markTaskFailed).toHaveBeenCalledWith(12, expect.any(String))
    expect(state.message).toMatch(/fila/i)
  })

  it("never leaks the internal error to the client", async () => {
    enqueueOptimization.mockRejectedValue(new Error("redis://user:senha@host"))

    const state = await startOptimization(undefined, new FormData())

    expect(state.message).not.toContain("senha")
  })

  it("reports a failure to read the data", async () => {
    collectTimetableData.mockRejectedValue(new Error("db caiu"))

    const state = await startOptimization(undefined, new FormData())

    expect(state.success).toBeUndefined()
    expect(state.message).toBeTruthy()
  })
})

describe("getOptimizationStatus", () => {
  it("is readable by a coordinator", async () => {
    await getOptimizationStatus()

    expect(requireRole).toHaveBeenCalledWith("coordinator")
  })

  it("returns no task when none ever ran", async () => {
    const status = await getOptimizationStatus()

    expect(status.task).toBeNull()
  })

  it("exposes the running task and the allocation counters", async () => {
    getLastTaskByType.mockResolvedValue(runningTask)

    const status = await getOptimizationStatus()

    expect(status.task).toMatchObject({
      id: 12,
      status: "PROCESSING",
      progress: 40,
    })
    expect(status.statistics).toEqual({ total: 10, scheduled: 4, pending: 6 })
  })

  it("serialises timestamps, since the value crosses to the client", async () => {
    getLastTaskByType.mockResolvedValue(runningTask)

    const status = await getOptimizationStatus()

    expect(typeof status.task?.finishedAt).toBe("string")
  })

  it("passes the error message through when the run failed", async () => {
    getLastTaskByType.mockResolvedValue({
      ...runningTask,
      status: "FAILED",
      error_message: "estourou",
    })

    const status = await getOptimizationStatus()

    expect(status.task?.errorMessage).toBe("estourou")
  })

  it("reports zero progress for a task that has not reported any yet", async () => {
    getLastTaskByType.mockResolvedValue({ ...runningTask, progress: null })

    const status = await getOptimizationStatus()

    expect(status.task?.progress).toBe(0)
  })

  it("falls back to the creation time when the row was never updated", async () => {
    getLastTaskByType.mockResolvedValue({ ...runningTask, updated_at: null })

    const status = await getOptimizationStatus()

    expect(status.task?.finishedAt).toBe("2024-05-01T12:00:00.000Z")
  })
})
