import {
  listTeacherAvailability,
  setTeacherAvailability,
} from "@/lib/db/actions/schedule-teachers"
import { db } from "@/lib/db/client"
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

describe("setTeacherAvailability", () => {
  it("creates the association when the teacher becomes available", async () => {
    queueResults(mockDb.select, [])
    queueResults(mockDb.insert, undefined)

    await expect(setTeacherAvailability(7, 3, true)).resolves.toBe(true)
    expect(chainOf(mockDb.insert).argsFor("values")).toEqual([
      { teacher_id: 7, schedule_id: 3 },
    ])
  })

  it("does nothing when the availability is already declared", async () => {
    queueResults(mockDb.select, [{ id: 11 }])

    await expect(setTeacherAvailability(7, 3, true)).resolves.toBe(false)
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it("removes the association when the teacher becomes unavailable", async () => {
    queueResults(mockDb.select, [{ id: 11 }])
    queueResults(mockDb.delete, undefined)

    await expect(setTeacherAvailability(7, 3, false)).resolves.toBe(true)
    expect(mockDb.delete).toHaveBeenCalledTimes(1)
  })

  it("does nothing when there is nothing to remove", async () => {
    queueResults(mockDb.select, [])

    await expect(setTeacherAvailability(7, 3, false)).resolves.toBe(false)
    expect(mockDb.delete).not.toHaveBeenCalled()
  })

  it("stays idempotent when the same toggle arrives twice", async () => {
    queueResults(mockDb.select, [], [{ id: 11 }])
    queueResults(mockDb.insert, undefined)

    await expect(setTeacherAvailability(7, 3, true)).resolves.toBe(true)
    await expect(setTeacherAvailability(7, 3, true)).resolves.toBe(false)

    expect(mockDb.insert).toHaveBeenCalledTimes(1)
  })

  it("scopes the lookup to the teacher and the schedule", async () => {
    queueResults(mockDb.select, [])
    queueResults(mockDb.insert, undefined)

    await setTeacherAvailability(7, 3, true)

    expect(chainOf(mockDb.select).argsFor("where")?.[0]).toBeDefined()
    expect(chainOf(mockDb.select).argsFor("limit")).toEqual([1])
  })
})

describe("listTeacherAvailability", () => {
  it("returns the schedule ids", async () => {
    queueResults(mockDb.select, [{ schedule_id: 1 }, { schedule_id: 4 }])

    await expect(listTeacherAvailability(7)).resolves.toEqual([1, 4])
  })

  it("returns an empty list when nothing was declared", async () => {
    queueResults(mockDb.select, [])

    await expect(listTeacherAvailability(7)).resolves.toEqual([])
  })

  it("drops rows with a null schedule", async () => {
    queueResults(mockDb.select, [{ schedule_id: 1 }, { schedule_id: null }])

    await expect(listTeacherAvailability(7)).resolves.toEqual([1])
  })
})
