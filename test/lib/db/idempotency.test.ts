import { db } from "@/lib/db/client"
import { runOnce } from "@/lib/db/idempotency"
import {
  chainOf,
  queueResults,
  resetMockDb,
  type MockDb,
} from "@/test/support/db"

jest.mock("@/lib/db/client", () => ({
  db: jest.requireActual("@/test/support/db").createMockDb(),
}))

const mockDb = db as unknown as MockDb

beforeEach(() => {
  resetMockDb(mockDb)
})

describe("runOnce", () => {
  it("runs the operation and reports it as applied", async () => {
    queueResults(mockDb.insert, undefined)
    const operation = jest.fn().mockResolvedValue("created")

    await expect(runOnce("shift.create", "key-1", operation)).resolves.toEqual({
      applied: true,
      result: "created",
    })
    expect(operation).toHaveBeenCalledTimes(1)
    expect(chainOf(mockDb.insert).argsFor("values")).toEqual([
      { key: "key-1", scope: "shift.create" },
    ])
  })

  it("skips the operation when the key was already claimed", async () => {
    mockDb.insert.mockImplementation(() => {
      throw new Error("Duplicate entry 'key-1' for key 'PRIMARY'")
    })
    const operation = jest.fn()

    await expect(runOnce("shift.create", "key-1", operation)).resolves.toEqual({
      applied: false,
    })
    expect(operation).not.toHaveBeenCalled()
  })

  it("treats a rejected claim as a replay too", async () => {
    mockDb.insert.mockReturnValueOnce({
      values: () => Promise.reject(new Error("duplicate")),
    } as never)
    const operation = jest.fn()

    await expect(runOnce("shift.create", "key-1", operation)).resolves.toEqual({
      applied: false,
    })
    expect(operation).not.toHaveBeenCalled()
  })

  it("runs without deduplication when no key is supplied", async () => {
    const operation = jest.fn().mockResolvedValue("created")

    await expect(runOnce("shift.create", undefined, operation)).resolves.toEqual(
      { applied: true, result: "created" },
    )
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it("releases the key when the operation fails, so a retry is possible", async () => {
    queueResults(mockDb.insert, undefined)
    queueResults(mockDb.delete, undefined)
    const failure = new Error("insert failed")

    await expect(
      runOnce("shift.create", "key-1", () => Promise.reject(failure)),
    ).rejects.toBe(failure)

    expect(mockDb.delete).toHaveBeenCalledTimes(1)
  })

  it("still surfaces the original error if releasing the key fails", async () => {
    queueResults(mockDb.insert, undefined)
    mockDb.delete.mockImplementation(() => {
      throw new Error("release failed")
    })
    const failure = new Error("insert failed")

    await expect(
      runOnce("shift.create", "key-1", () => Promise.reject(failure)),
    ).rejects.toBe(failure)
  })
})
