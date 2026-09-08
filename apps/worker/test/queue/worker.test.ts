import { OPTIMIZE_TIMETABLE_JOB } from "@/queue/jobs"
import { InvalidJobPayloadError } from "@/queue/processor"
import { handleJob } from "@/queue/worker"
import { buildInput } from "@test/support/timetable"

function fakeJob(overrides: Record<string, unknown> = {}) {
  return {
    name: OPTIMIZE_TIMETABLE_JOB,
    data: {
      data: buildInput(),
      options: { seed: 1, evolutionRuns: 1, maxStagnation: 3, annealingIterations: 5 },
    },
    updateProgress: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe("handleJob", () => {
  it("optimizes the timetable carried by a well-formed job", async () => {
    const result = await handleJob(fakeJob() as never, "token")

    expect(result.schedule).toHaveLength(2)
  })

  it("forwards progress to the job", async () => {
    const job = fakeJob()

    await handleJob(job as never, "token")

    expect(job.updateProgress).toHaveBeenCalledWith(100)
  })

  it("refuses a job it does not know how to run", async () => {
    await expect(
      handleJob(fakeJob({ name: "something-else" }) as never, "token"),
    ).rejects.toBeInstanceOf(InvalidJobPayloadError)
  })

  it("propagates an invalid payload so BullMQ can fail the job", async () => {
    await expect(
      handleJob(fakeJob({ data: { data: { shifts: [{ id: 0 }] } } }) as never, "token"),
    ).rejects.toBeInstanceOf(InvalidJobPayloadError)
  })
})

describe("handleJob failure reporting", () => {
  function fakeSink() {
    return {
      progress: jest.fn().mockResolvedValue(undefined),
      persist: jest.fn().mockResolvedValue(undefined),
      complete: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn().mockResolvedValue(undefined),
    }
  }

  it("marks the task failed when the payload is invalid", async () => {
    const sink = fakeSink()
    const job = fakeJob({ data: { taskId: 9, data: { shifts: [{ id: 0 }] } } })

    await expect(handleJob(job as never, "token", { sink })).rejects.toBeInstanceOf(
      InvalidJobPayloadError,
    )
    expect(sink.fail).toHaveBeenCalledWith(9, expect.stringContaining("inválido"))
  })

  it("marks the task failed when the job name is unknown", async () => {
    const sink = fakeSink()
    const job = fakeJob({ name: "outra-coisa", data: { taskId: 9 } })

    await expect(handleJob(job as never, "token", { sink })).rejects.toThrow()
    expect(sink.fail).toHaveBeenCalledWith(9, expect.stringContaining("outra-coisa"))
  })

  it("marks the task failed when persistence blows up", async () => {
    const sink = fakeSink()
    sink.persist.mockRejectedValue(new Error("banco indisponível"))

    await expect(
      handleJob(fakeJob({ data: { taskId: 9, ...fakeJob().data } }) as never, "token", {
        sink,
      }),
    ).rejects.toThrow("banco indisponível")
    expect(sink.fail).toHaveBeenCalledWith(9, expect.any(String))
  })

  it("has nothing to report when the job carries no task id", async () => {
    const sink = fakeSink()

    await expect(
      handleJob(fakeJob({ name: "outra-coisa" }) as never, "token", { sink }),
    ).rejects.toThrow()
    expect(sink.fail).not.toHaveBeenCalled()
  })

  it("still rethrows the original error when reporting the failure fails", async () => {
    const sink = fakeSink()
    sink.fail.mockRejectedValue(new Error("banco também caiu"))
    const job = fakeJob({ name: "outra-coisa", data: { taskId: 9 } })

    await expect(handleJob(job as never, "token", { sink })).rejects.toThrow(
      "outra-coisa",
    )
  })
})
describe("failure messages", () => {
  function fakeSink() {
    return {
      progress: jest.fn().mockResolvedValue(undefined),
      persist: jest.fn().mockResolvedValue(undefined),
      complete: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn().mockResolvedValue(undefined),
    }
  }

  it("keeps the validation detail, which tells the user what to fix", async () => {
    const sink = fakeSink()
    const job = fakeJob({ data: { taskId: 9, data: { shifts: [{ id: 0 }] } } })

    await expect(handleJob(job as never, "token", { sink })).rejects.toThrow()
    expect(sink.fail.mock.calls[0][1]).toContain("shifts")
  })

  it("hides an infrastructure error behind a generic message", async () => {
    const sink = fakeSink()
    sink.persist.mockRejectedValue(
      new Error("connect ECONNREFUSED 10.0.0.7:3306"),
    )
    const job = fakeJob({ data: { taskId: 9, ...fakeJob().data } })

    await expect(handleJob(job as never, "token", { sink })).rejects.toThrow(
      "ECONNREFUSED",
    )
    expect(sink.fail.mock.calls[0][1]).not.toContain("10.0.0.7")
  })
})