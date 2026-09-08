import { enqueueOptimization, resetOptimizationQueue } from "@/producer"

const add = jest.fn()
const close = jest.fn()
const constructed: { name: string; options: unknown }[] = []

jest.mock("bullmq", () => ({
  Queue: class {
    add = add
    close = close

    constructor(name: string, options: unknown) {
      constructed.push({ name, options })
    }
  },
}))

const env = {
  REDIS_URL: "redis://localhost:6379",
  TIMETABLING_QUEUE: "timetabling",
  WORKER_CONCURRENCY: "1",
}

beforeEach(async () => {
  await resetOptimizationQueue()
  constructed.length = 0
  add.mockReset()
  close.mockReset()
  add.mockResolvedValue({ id: "42" })
})

describe("enqueueOptimization", () => {
  it("adds the job under the agreed name", async () => {
    await enqueueOptimization({ data: { any: "payload" } }, { env })

    expect(add).toHaveBeenCalledWith(
      "optimize-timetable",
      { data: { any: "payload" } },
      expect.any(Object),
    )
  })

  it("returns the id BullMQ assigned", async () => {
    const result = await enqueueOptimization({ data: {} }, { env })

    expect(result.jobId).toBe("42")
  })

  it("builds the queue from the configured name and connection", async () => {
    await enqueueOptimization({ data: {} }, { env })

    expect(constructed).toHaveLength(1)
    expect(constructed[0].name).toBe("timetabling")
    expect(constructed[0].options).toMatchObject({
      connection: { host: "localhost", port: 6379 },
    })
  })

  it("reuses the same queue across calls, instead of one connection per job", async () => {
    await enqueueOptimization({ data: {} }, { env })
    await enqueueOptimization({ data: {} }, { env })

    expect(constructed).toHaveLength(1)
    expect(add).toHaveBeenCalledTimes(2)
  })

  it("carries the correlation id and task id through", async () => {
    await enqueueOptimization(
      { correlationId: "abc", taskId: 7, data: {} },
      { env },
    )

    expect(add).toHaveBeenCalledWith(
      "optimize-timetable",
      { correlationId: "abc", taskId: 7, data: {} },
      expect.any(Object),
    )
  })

  it("keeps a bounded history so Redis does not grow without limit", async () => {
    await enqueueOptimization({ data: {} }, { env })

    expect(add.mock.calls[0][2]).toMatchObject({
      removeOnComplete: expect.objectContaining({ count: expect.any(Number) }),
      removeOnFail: expect.objectContaining({ count: expect.any(Number) }),
    })
  })

  it("does not retry on its own, since a rerun is the user's decision", async () => {
    await enqueueOptimization({ data: {} }, { env })

    expect(add.mock.calls[0][2]).toMatchObject({ attempts: 1 })
  })

  it("refuses to enqueue when the configuration is invalid", async () => {
    await expect(
      enqueueOptimization({ data: {} }, { env: { REDIS_URL: "não-é-url" } }),
    ).rejects.toThrow(/REDIS_URL/)
    expect(add).not.toHaveBeenCalled()
  })

  it("propagates a failure to reach Redis", async () => {
    add.mockRejectedValue(new Error("ECONNREFUSED"))

    await expect(enqueueOptimization({ data: {} }, { env })).rejects.toThrow(
      "ECONNREFUSED",
    )
  })
})

describe("resetOptimizationQueue", () => {
  it("closes the open queue", async () => {
    await enqueueOptimization({ data: {} }, { env })

    await resetOptimizationQueue()

    expect(close).toHaveBeenCalledTimes(1)
  })

  it("is a no-op when no queue was ever opened", async () => {
    await expect(resetOptimizationQueue()).resolves.toBeUndefined()
    expect(close).not.toHaveBeenCalled()
  })

  it("lets the next call open a fresh queue", async () => {
    await enqueueOptimization({ data: {} }, { env })
    await resetOptimizationQueue()
    await enqueueOptimization({ data: {} }, { env })

    expect(constructed).toHaveLength(2)
  })
})
