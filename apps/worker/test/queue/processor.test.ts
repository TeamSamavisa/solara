import { InvalidJobPayloadError, processOptimizeJob } from "@/queue/processor"
import { buildInput } from "@test/support/timetable"

const fastOptions = {
  seed: 1,
  evolutionRuns: 2,
  maxStagnation: 5,
  annealingIterations: 10,
}

describe("processOptimizeJob", () => {
  it("optimizes the timetable carried by the job", async () => {
    const result = await processOptimizeJob({
      data: buildInput(),
      options: fastOptions,
    })

    expect(result.schedule).toHaveLength(2)
    expect(result.statistics.hard_constraints_satisfied).toBe(true)
  })

  it("echoes the correlation id so the web app can match the result", async () => {
    const result = await processOptimizeJob({
      correlationId: "optimization-123",
      data: buildInput(),
      options: fastOptions,
    })

    expect(result.correlationId).toBe("optimization-123")
  })

  it("is reproducible when a seed is given", async () => {
    const payload = { data: buildInput(), options: fastOptions }

    const a = await processOptimizeJob(payload)
    const b = await processOptimizeJob(payload)

    expect(a.schedule).toEqual(b.schedule)
  })

  it("accepts a job with no options at all", async () => {
    const result = await processOptimizeJob({
      data: {
        ...buildInput(),
        // Keep it trivial so the default budget stays fast.
        class_allocations: [],
      },
    })

    expect(result.schedule).toEqual([])
  })

  it("reports progress as it moves through the phases", async () => {
    const updateProgress = jest.fn()

    await processOptimizeJob(
      { data: buildInput(), options: fastOptions },
      { updateProgress },
    )

    const reported = updateProgress.mock.calls.map(([value]) => value)
    expect(reported[0]).toBeLessThan(reported[reported.length - 1])
    expect(reported[reported.length - 1]).toBe(100)
  })

  it("survives a progress reporter that throws", async () => {
    const updateProgress = jest.fn(() => {
      throw new Error("redis unavailable")
    })

    await expect(
      processOptimizeJob(
        { data: buildInput(), options: fastOptions },
        { updateProgress },
      ),
    ).resolves.toMatchObject({ schedule: expect.any(Array) })
  })

  it("rejects a payload that is not an object", async () => {
    await expect(processOptimizeJob("nope")).rejects.toBeInstanceOf(
      InvalidJobPayloadError,
    )
  })

  it("rejects a payload whose timetable is malformed", async () => {
    await expect(
      processOptimizeJob({ data: { shifts: [{ id: 0, name: "X" }] } }),
    ).rejects.toBeInstanceOf(InvalidJobPayloadError)
  })

  it("explains which field was rejected", async () => {
    await expect(
      processOptimizeJob({ data: { shifts: [{ id: 0, name: "X" }] } }),
    ).rejects.toThrow(/shifts/)
  })

  it("reports the unplaced allocations alongside the schedule", async () => {
    const input = buildInput()
    input.classrooms.forEach((room) => (room.blocked = true))

    const result = await processOptimizeJob({
      data: input,
      options: fastOptions,
    })

    expect(result.unplaced).toHaveLength(2)
  })
})

describe("processOptimizeJob with a sink", () => {
  function fakeSink() {
    return {
      progress: jest.fn().mockResolvedValue(undefined),
      persist: jest.fn().mockResolvedValue(undefined),
      complete: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn().mockResolvedValue(undefined),
    }
  }

  it("persists the optimized schedule", async () => {
    const sink = fakeSink()

    const result = await processOptimizeJob(
      { taskId: 5, data: buildInput(), options: fastOptions },
      { sink },
    )

    expect(sink.persist).toHaveBeenCalledWith(result.schedule)
  })

  it("persists before it marks the task completed", async () => {
    const sink = fakeSink()
    const order: string[] = []
    sink.persist.mockImplementation(async () => {
      order.push("persist")
    })
    sink.complete.mockImplementation(async () => {
      order.push("complete")
    })

    await processOptimizeJob(
      { taskId: 5, data: buildInput(), options: fastOptions },
      { sink },
    )

    expect(order).toEqual(["persist", "complete"])
  })

  it("reports progress against the task row", async () => {
    const sink = fakeSink()

    await processOptimizeJob(
      { taskId: 5, data: buildInput(), options: fastOptions },
      { sink },
    )

    expect(sink.progress.mock.calls).toEqual([[5, 10], [5, 90]])
  })

  it("leaves progress to completion, which already sets it to 100", async () => {
    const sink = fakeSink()

    await processOptimizeJob(
      { taskId: 5, data: buildInput(), options: fastOptions },
      { sink },
    )

    expect(sink.progress).not.toHaveBeenCalledWith(5, 100)
    expect(sink.complete).toHaveBeenCalledWith(5)
  })

  it("still persists when the job carries no task to track", async () => {
    const sink = fakeSink()

    await processOptimizeJob(
      { data: buildInput(), options: fastOptions },
      { sink },
    )

    expect(sink.persist).toHaveBeenCalledTimes(1)
    expect(sink.progress).not.toHaveBeenCalled()
    expect(sink.complete).not.toHaveBeenCalled()
  })

  it("fails the job when the result cannot be persisted", async () => {
    const sink = fakeSink()
    sink.persist.mockRejectedValue(new Error("banco indisponível"))

    await expect(
      processOptimizeJob(
        { taskId: 5, data: buildInput(), options: fastOptions },
        { sink },
      ),
    ).rejects.toThrow("banco indisponível")
    expect(sink.complete).not.toHaveBeenCalled()
  })

  it("never persists a payload it could not validate", async () => {
    const sink = fakeSink()

    await expect(
      processOptimizeJob({ data: { shifts: [{ id: 0 }] } }, { sink }),
    ).rejects.toBeInstanceOf(InvalidJobPayloadError)
    expect(sink.persist).not.toHaveBeenCalled()
  })

  it("works exactly as before when no sink is wired", async () => {
    const result = await processOptimizeJob({
      taskId: 5,
      data: buildInput(),
      options: fastOptions,
    })

    expect(result.taskId).toBe(5)
  })
})
describe("processOptimizeJob reporting", () => {
  it("forwards the optimizer events to the context", async () => {
    const onEvent = jest.fn()

    await processOptimizeJob(
      { data: buildInput(), options: fastOptions },
      { onEvent },
    )

    const types = onEvent.mock.calls.map(([event]) => event.type)
    expect(types).toContain("prepared")
    expect(types).toContain("statistics")
  })

  it("does not require a reporter", async () => {
    await expect(
      processOptimizeJob({ data: buildInput(), options: fastOptions }),
    ).resolves.toBeDefined()
  })

  it("reports nothing for a payload it rejected", async () => {
    const onEvent = jest.fn()

    await expect(
      processOptimizeJob({ data: { shifts: [{ id: 0 }] } }, { onEvent }),
    ).rejects.toBeInstanceOf(InvalidJobPayloadError)
    expect(onEvent).not.toHaveBeenCalled()
  })
})