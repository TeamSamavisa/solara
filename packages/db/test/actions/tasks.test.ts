import {
  createTask,
  getLastTaskByType,
  getTaskByCorrelationId,
  getTaskById,
  markTaskCompleted,
  markTaskFailed,
  updateTaskProgress,
} from "@/actions/tasks"
import { db } from "@/client"
import { NotFoundError } from "@/errors"
import {
  chainOf,
  queueResults,
  resetMockDb,
  type MockDb,
} from "@test/support/db"

jest.mock("@/client", () => ({
  db: jest.requireActual("@test/support/db").createMockDb(),
}))

const mockDb = db as unknown as MockDb

const task = {
  id: 5,
  correlation_id: "optimization-1",
  status: "PROCESSING",
  type: "TIMETABLE_OPTIMIZATION",
  error_message: null,
  progress: 0,
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-01"),
}

beforeEach(() => {
  resetMockDb(mockDb)
})

describe("createTask", () => {
  it("inserts the task and returns it", async () => {
    queueResults(mockDb.insert, [{ id: 5 }])
    queueResults(mockDb.select, [task])

    await expect(
      createTask({
        correlation_id: "optimization-1",
        type: "TIMETABLE_OPTIMIZATION",
      }),
    ).resolves.toEqual(task)
  })

  it("starts as processing with no progress", async () => {
    queueResults(mockDb.insert, [{ id: 5 }])
    queueResults(mockDb.select, [task])

    await createTask({
      correlation_id: "optimization-1",
      type: "TIMETABLE_OPTIMIZATION",
    })

    expect(chainOf(mockDb.insert).argsFor("values")).toMatchObject([
      {
        correlation_id: "optimization-1",
        type: "TIMETABLE_OPTIMIZATION",
        status: "PROCESSING",
        progress: 0,
      },
    ])
  })

  it("honours an explicit initial status", async () => {
    queueResults(mockDb.insert, [{ id: 5 }])
    queueResults(mockDb.select, [task])

    await createTask({
      correlation_id: "optimization-1",
      type: "TIMETABLE_OPTIMIZATION",
      status: "COMPLETED",
    })

    const values = chainOf(mockDb.insert).argsFor("values")?.[0] as {
      status: string
    }
    expect(values.status).toBe("COMPLETED")
  })

  it("rejects an empty correlation id before touching the database", async () => {
    await expect(
      createTask({ correlation_id: "", type: "TIMETABLE_OPTIMIZATION" }),
    ).rejects.toThrow()
    expect(mockDb.insert).not.toHaveBeenCalled()
  })
})

describe("getTaskById", () => {
  it("returns the task", async () => {
    queueResults(mockDb.select, [task])

    await expect(getTaskById(5)).resolves.toEqual(task)
  })

  it("throws NotFoundError for an unknown id", async () => {
    queueResults(mockDb.select, [])

    await expect(getTaskById(404)).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe("getTaskByCorrelationId", () => {
  it("returns the task", async () => {
    queueResults(mockDb.select, [task])

    await expect(getTaskByCorrelationId("optimization-1")).resolves.toEqual(
      task,
    )
  })

  it("returns null instead of throwing when there is none", async () => {
    queueResults(mockDb.select, [])

    await expect(getTaskByCorrelationId("nope")).resolves.toBeNull()
  })
})

describe("getLastTaskByType", () => {
  it("returns the most recent task of that type", async () => {
    queueResults(mockDb.select, [task])

    await expect(getLastTaskByType("TIMETABLE_OPTIMIZATION")).resolves.toEqual(
      task,
    )
    expect(chainOf(mockDb.select).argsFor("limit")).toEqual([1])
    expect(chainOf(mockDb.select).argsFor("orderBy")).toBeDefined()
  })

  it("returns null when the type was never run", async () => {
    queueResults(mockDb.select, [])

    await expect(
      getLastTaskByType("TIMETABLE_OPTIMIZATION"),
    ).resolves.toBeNull()
  })
})

describe("updateTaskProgress", () => {
  it("writes the new progress", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [{ ...task, progress: 40 }])
    queueResults(mockDb.update, undefined)

    await expect(updateTaskProgress(5, 40)).resolves.toMatchObject({
      progress: 40,
    })
    expect(chainOf(mockDb.update).argsFor("set")).toMatchObject([
      { progress: 40 }])
  })

  it("clamps a progress above the maximum", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [task])
    queueResults(mockDb.update, undefined)

    await updateTaskProgress(5, 250)

    expect(chainOf(mockDb.update).argsFor("set")).toMatchObject([
      { progress: 100 }])
  })

  it("clamps a negative progress", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [task])
    queueResults(mockDb.update, undefined)

    await updateTaskProgress(5, -10)

    expect(chainOf(mockDb.update).argsFor("set")).toMatchObject([
      { progress: 0 }])
  })

  it("rounds a fractional progress", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [task])
    queueResults(mockDb.update, undefined)

    await updateTaskProgress(5, 33.7)

    expect(chainOf(mockDb.update).argsFor("set")).toMatchObject([
      { progress: 34 }])
  })

  it("throws for an unknown task", async () => {
    queueResults(mockDb.select, [])

    await expect(updateTaskProgress(404, 10)).rejects.toBeInstanceOf(
      NotFoundError,
    )
    expect(mockDb.update).not.toHaveBeenCalled()
  })
})

describe("markTaskCompleted", () => {
  it("sets the status and fills the progress bar", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [task])
    queueResults(mockDb.update, undefined)

    await markTaskCompleted(5)

    expect(chainOf(mockDb.update).argsFor("set")).toMatchObject([
      { status: "COMPLETED", progress: 100, error_message: null },
    ])
  })

  it("clears a previous error message", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [task])
    queueResults(mockDb.update, undefined)

    await markTaskCompleted(5)

    const values = chainOf(mockDb.update).argsFor("set")?.[0] as {
      error_message: string | null
    }
    expect(values.error_message).toBeNull()
  })
})

describe("markTaskFailed", () => {
  it("records the reason", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [task])
    queueResults(mockDb.update, undefined)

    await markTaskFailed(5, "Redis indisponível")

    expect(chainOf(mockDb.update).argsFor("set")).toMatchObject([
      { status: "FAILED", error_message: "Redis indisponível" },
    ])
  })

  it("truncates a message too long for the column", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [task])
    queueResults(mockDb.update, undefined)

    await markTaskFailed(5, "x".repeat(5000))

    const values = chainOf(mockDb.update).argsFor("set")?.[0] as {
      error_message: string
    }
    expect(values.error_message.length).toBeLessThanOrEqual(2000)
  })

  it("throws for an unknown task", async () => {
    queueResults(mockDb.select, [])

    await expect(markTaskFailed(404, "erro")).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })
})

/** Column names a drizzle `orderBy` fragment refers to. */
function orderedColumns(fragment: { queryChunks?: unknown[] }): string[] {
  return (fragment.queryChunks ?? [])
    .map((chunk) => (chunk as { name?: unknown }).name)
    .filter((name): name is string => typeof name === "string")
}

describe("task timestamps", () => {
  /**
   * The live `tasks` table carries the legacy DDL, where both timestamps are
   * nullable with no default. Leaving them to the database therefore wrote
   * NULLs, and MySQL sorts NULLs last on a descending order — so the newest
   * task lost to any older one that did have a timestamp, and the screen
   * reported a finished run while the worker was still going.
   */
  it("stamps a new task instead of leaving it to the database", async () => {
    queueResults(mockDb.insert, [{ id: 7 }])
    queueResults(mockDb.select, [task])

    await createTask({
      correlation_id: "abc",
      type: "TIMETABLE_OPTIMIZATION",
    })

    const [values] = chainOf(mockDb.insert).argsFor("values") as [
      Record<string, unknown>,
    ]

    expect(values.created_at).toBeInstanceOf(Date)
    expect(values.updated_at).toBeInstanceOf(Date)
  })

  it("bumps the timestamp when the progress moves", async () => {
    queueResults(mockDb.select, [{ id: 7 }])
    queueResults(mockDb.update, undefined)
    queueResults(mockDb.select, [task])

    await updateTaskProgress(7, 40)

    const [values] = chainOf(mockDb.update).argsFor("set") as [
      Record<string, unknown>,
    ]

    expect(values.updated_at).toBeInstanceOf(Date)
  })

  it("bumps the timestamp when the task completes", async () => {
    queueResults(mockDb.select, [{ id: 7 }])
    queueResults(mockDb.update, undefined)
    queueResults(mockDb.select, [task])

    await markTaskCompleted(7)

    const [values] = chainOf(mockDb.update).argsFor("set") as [
      Record<string, unknown>,
    ]

    expect(values.updated_at).toBeInstanceOf(Date)
  })

  it("bumps the timestamp when the task fails", async () => {
    queueResults(mockDb.select, [{ id: 7 }])
    queueResults(mockDb.update, undefined)
    queueResults(mockDb.select, [task])

    await markTaskFailed(7, "estourou")

    const [values] = chainOf(mockDb.update).argsFor("set") as [
      Record<string, unknown>,
    ]

    expect(values.updated_at).toBeInstanceOf(Date)
  })
})

describe("getLastTaskByType ordering", () => {
  it("orders by the primary key, which is monotonic and never null", async () => {
    queueResults(mockDb.select, [task])

    await getLastTaskByType("TIMETABLE_OPTIMIZATION")

    const order = chainOf(mockDb.select).argsFor("orderBy") ?? []

    expect(order).toHaveLength(1)
    expect(orderedColumns(order[0] as { queryChunks?: unknown[] })).toEqual([
      "id",
    ])
  })

  it("does not sort on a nullable timestamp", async () => {
    queueResults(mockDb.select, [task])

    await getLastTaskByType("TIMETABLE_OPTIMIZATION")

    const order = chainOf(mockDb.select).argsFor("orderBy") ?? []
    const columns = order.flatMap((fragment) =>
      orderedColumns(fragment as { queryChunks?: unknown[] }),
    )

    expect(columns).not.toContain("created_at")
  })
})