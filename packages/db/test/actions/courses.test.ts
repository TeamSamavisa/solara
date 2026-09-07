import { ZodError } from "zod"

import {
  createCourse,
  getCourseById,
  listCourses,
  removeCourse,
  updateCourse,
} from "@/actions/courses"
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

const courseRow = {
  id: 7,
  name: "Análise e Desenvolvimento",
  course_type_id: 2,
  courseType: { id: 2, name: "Tecnólogo" },
}

beforeEach(() => {
  resetMockDb(mockDb)
})

describe("createCourse", () => {
  it("inserts the course and returns it with its course type", async () => {
    queueResults(mockDb.insert, [{ id: 7 }])
    queueResults(mockDb.select, [courseRow])

    const result = await createCourse({
      name: "Análise e Desenvolvimento",
      course_type_id: 2,
    })

    expect(result).toEqual(courseRow)
    expect(chainOf(mockDb.insert).argsFor("values")).toEqual([
      { name: "Análise e Desenvolvimento", course_type_id: 2 },
    ])
    expect(mockDb.select).toHaveBeenCalledTimes(1)
  })

  it("rejects an invalid payload before touching the database", async () => {
    await expect(
      createCourse({ name: "", course_type_id: 2 }),
    ).rejects.toBeInstanceOf(ZodError)

    expect(mockDb.insert).not.toHaveBeenCalled()
    expect(mockDb.select).not.toHaveBeenCalled()
  })

  it("rejects a non positive course type id", async () => {
    await expect(
      createCourse({ name: "Redes", course_type_id: 0 }),
    ).rejects.toBeInstanceOf(ZodError)
  })
})

describe("listCourses", () => {
  it("returns the rows together with the pagination metadata", async () => {
    queueResults(mockDb.select, [courseRow], [{ value: 1 }])

    const result = await listCourses({})

    expect(result).toEqual({
      content: [courseRow],
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

  it("applies the default page size and offset", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listCourses({})

    const rowsQuery = chainOf(mockDb.select, 0)
    expect(rowsQuery.argsFor("limit")).toEqual([10])
    expect(rowsQuery.argsFor("offset")).toEqual([0])
  })

  it("translates the page into an offset", async () => {
    queueResults(mockDb.select, [], [{ value: 40 }])

    const result = await listCourses({ page: 3, limit: 10 })

    expect(chainOf(mockDb.select, 0).argsFor("offset")).toEqual([20])
    expect(result.pagination).toMatchObject({
      currentPage: 3,
      totalPages: 4,
      hasNextPage: true,
      hasPrevPage: true,
    })
  })

  it("coerces the pagination values coming from a query string", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listCourses({ page: "2", limit: "5" })

    const rowsQuery = chainOf(mockDb.select, 0)
    expect(rowsQuery.argsFor("limit")).toEqual([5])
    expect(rowsQuery.argsFor("offset")).toEqual([5])
  })

  it("builds a where clause when filters are supplied", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listCourses({ name: "Redes", course_type_id: 2 })

    expect(chainOf(mockDb.select, 0).argsFor("where")?.[0]).toBeDefined()
  })

  it("ignores an empty string filter, like the legacy buildWhere", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listCourses({ name: "" })

    expect(chainOf(mockDb.select, 0).argsFor("where")).toEqual([undefined])
  })

  it("joins the course type and orders by name", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listCourses({})

    const rowsQuery = chainOf(mockDb.select, 0)
    expect(rowsQuery.callCount("leftJoin")).toBe(1)
    expect(rowsQuery.argsFor("orderBy")).toBeDefined()
  })

  it("returns an empty page when there is nothing to list", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    const result = await listCourses({})

    expect(result.content).toEqual([])
    expect(result.pagination).toMatchObject({
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    })
  })

  it("rejects a limit above the allowed maximum", async () => {
    await expect(listCourses({ limit: 500 })).rejects.toBeInstanceOf(ZodError)
    expect(mockDb.select).not.toHaveBeenCalled()
  })
})

describe("getCourseById", () => {
  it("returns the course with its course type", async () => {
    queueResults(mockDb.select, [courseRow])

    await expect(getCourseById(7)).resolves.toEqual(courseRow)
    expect(chainOf(mockDb.select).argsFor("limit")).toEqual([1])
  })

  it("throws NotFoundError when the course does not exist", async () => {
    queueResults(mockDb.select, [])

    await expect(getCourseById(404)).rejects.toThrow(
      new NotFoundError("Curso não encontrado."),
    )
  })
})

describe("updateCourse", () => {
  it("updates only the supplied fields and returns the refreshed course", async () => {
    queueResults(mockDb.select, [{ id: 7 }], [courseRow])
    queueResults(mockDb.update, undefined)

    const result = await updateCourse(7, { name: "Novo nome" })

    expect(chainOf(mockDb.update).argsFor("set")).toEqual([
      { name: "Novo nome" },
    ])
    expect(result).toEqual(courseRow)
  })

  it("does not run an update statement when the payload is empty", async () => {
    queueResults(mockDb.select, [{ id: 7 }], [courseRow])

    await expect(updateCourse(7, {})).resolves.toEqual(courseRow)
    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it("throws NotFoundError before updating an unknown course", async () => {
    queueResults(mockDb.select, [])

    await expect(updateCourse(404, { name: "x" })).rejects.toThrow(
      new NotFoundError("Curso não encontrado."),
    )
    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it("rejects an invalid payload", async () => {
    await expect(updateCourse(7, { name: "" })).rejects.toBeInstanceOf(ZodError)
    expect(mockDb.select).not.toHaveBeenCalled()
  })
})

describe("removeCourse", () => {
  it("deletes the course and returns the removed row", async () => {
    const row = { id: 7, name: "Redes", course_type_id: 2 }
    queueResults(mockDb.select, [row])
    queueResults(mockDb.delete, undefined)

    await expect(removeCourse(7)).resolves.toEqual(row)
    expect(mockDb.delete).toHaveBeenCalledTimes(1)
    expect(chainOf(mockDb.delete).argsFor("where")?.[0]).toBeDefined()
  })

  it("throws NotFoundError and deletes nothing when the course is unknown", async () => {
    queueResults(mockDb.select, [])

    await expect(removeCourse(404)).rejects.toThrow(
      new NotFoundError("Curso não encontrado."),
    )
    expect(mockDb.delete).not.toHaveBeenCalled()
  })
})
