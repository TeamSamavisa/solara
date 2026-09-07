import { ZodError } from "zod"

import * as courseTypeActions from "@/actions/course-types"
import * as shiftActions from "@/actions/shifts"
import * as spaceTypeActions from "@/actions/space-types"
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

const entities = [
  {
    label: "course type",
    notFound: "Tipo de curso não encontrado.",
    create: courseTypeActions.createCourseType,
    list: courseTypeActions.listCourseTypes,
    getById: courseTypeActions.getCourseTypeById,
    update: courseTypeActions.updateCourseType,
    remove: courseTypeActions.removeCourseType,
  },
  {
    label: "shift",
    notFound: "Turno não encontrado.",
    create: shiftActions.createShift,
    list: shiftActions.listShifts,
    getById: shiftActions.getShiftById,
    update: shiftActions.updateShift,
    remove: shiftActions.removeShift,
  },
  {
    label: "space type",
    notFound: "Tipo de espaço não encontrado.",
    create: spaceTypeActions.createSpaceType,
    list: spaceTypeActions.listSpaceTypes,
    getById: spaceTypeActions.getSpaceTypeById,
    update: spaceTypeActions.updateSpaceType,
    remove: spaceTypeActions.removeSpaceType,
  },
] as const

beforeEach(() => {
  resetMockDb(mockDb)
})

describe.each(entities)(
  "$label actions",
  ({ notFound, create, list, getById, update, remove }) => {
    const row = { id: 3, name: "Integral" }

    describe("create", () => {
      it("inserts the row and returns it", async () => {
        queueResults(mockDb.insert, [{ id: 3 }])
        queueResults(mockDb.select, [row])

        await expect(create({ name: "Integral" })).resolves.toEqual(row)
        expect(chainOf(mockDb.insert).argsFor("values")).toEqual([
          { name: "Integral" },
        ])
      })

      it("rejects an empty name without hitting the database", async () => {
        await expect(create({ name: "" })).rejects.toBeInstanceOf(ZodError)
        expect(mockDb.insert).not.toHaveBeenCalled()
      })
    })

    describe("list", () => {
      it("returns the rows with pagination metadata", async () => {
        queueResults(mockDb.select, [row], [{ value: 1 }])

        await expect(list({})).resolves.toEqual({
          content: [row],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            itemsPerPage: 10,
            hasNextPage: false,
            hasPrevPage: false,
          },
        })
      })

      it("paginates with limit and offset", async () => {
        queueResults(mockDb.select, [], [{ value: 30 }])

        await list({ page: 2, limit: 5 })

        const rowsQuery = chainOf(mockDb.select, 0)
        expect(rowsQuery.argsFor("limit")).toEqual([5])
        expect(rowsQuery.argsFor("offset")).toEqual([5])
      })

      it("ignores an empty name filter", async () => {
        queueResults(mockDb.select, [], [{ value: 0 }])

        await list({ name: "" })

        expect(chainOf(mockDb.select, 0).argsFor("where")).toEqual([undefined])
      })

      it("applies a name filter when present", async () => {
        queueResults(mockDb.select, [], [{ value: 0 }])

        await list({ name: "Integral" })

        expect(chainOf(mockDb.select, 0).argsFor("where")?.[0]).toBeDefined()
      })

      it("rejects an out of range limit", async () => {
        await expect(list({ limit: 0 })).rejects.toBeInstanceOf(ZodError)
      })
    })

    describe("getById", () => {
      it("returns the row", async () => {
        queueResults(mockDb.select, [row])

        await expect(getById(3)).resolves.toEqual(row)
      })

      it("throws NotFoundError with the legacy message", async () => {
        queueResults(mockDb.select, [])

        await expect(getById(404)).rejects.toThrow(new NotFoundError(notFound))
      })
    })

    describe("update", () => {
      it("writes the new name and returns the refreshed row", async () => {
        queueResults(mockDb.select, [row], [{ ...row, name: "Noturno" }])
        queueResults(mockDb.update, undefined)

        await expect(update(3, { name: "Noturno" })).resolves.toEqual({
          ...row,
          name: "Noturno",
        })
        expect(chainOf(mockDb.update).argsFor("set")).toEqual([
          { name: "Noturno" },
        ])
      })

      it("skips the update statement when there is nothing to change", async () => {
        queueResults(mockDb.select, [row], [row])

        await expect(update(3, {})).resolves.toEqual(row)
        expect(mockDb.update).not.toHaveBeenCalled()
      })

      it("throws NotFoundError for an unknown row", async () => {
        queueResults(mockDb.select, [])

        await expect(update(404, { name: "x" })).rejects.toThrow(NotFoundError)
        expect(mockDb.update).not.toHaveBeenCalled()
      })

      it("rejects an invalid payload", async () => {
        await expect(update(3, { name: "" })).rejects.toBeInstanceOf(ZodError)
        expect(mockDb.select).not.toHaveBeenCalled()
      })
    })

    describe("remove", () => {
      it("deletes the row and returns it", async () => {
        queueResults(mockDb.select, [row])
        queueResults(mockDb.delete, undefined)

        await expect(remove(3)).resolves.toEqual(row)
        expect(mockDb.delete).toHaveBeenCalledTimes(1)
      })

      it("throws NotFoundError and deletes nothing", async () => {
        queueResults(mockDb.select, [])

        await expect(remove(404)).rejects.toThrow(NotFoundError)
        expect(mockDb.delete).not.toHaveBeenCalled()
      })
    })
  },
)
