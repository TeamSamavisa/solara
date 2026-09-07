import { ZodError } from "zod"

import * as classGroupActions from "@/lib/db/actions/class-groups"
import * as scheduleTeacherActions from "@/lib/db/actions/schedule-teachers"
import * as scheduleActions from "@/lib/db/actions/schedules"
import * as spaceActions from "@/lib/db/actions/spaces"
import * as subjectActions from "@/lib/db/actions/subjects"
import { db } from "@/lib/db/client"
import { NotFoundError } from "@/lib/db/errors"
import type { PaginatedResponse } from "@/lib/db/pagination"
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

/**
 * The entities below have different payload shapes, so the actions are widened
 * to a common signature to keep the shared suite type-checkable.
 */
interface CrudEntityUnderTest {
  label: string
  notFound: string
  joins: number
  valid: Record<string, unknown>
  invalid: Record<string, unknown>
  partial: Record<string, unknown>
  create: (input: Record<string, unknown>) => Promise<unknown>
  list: (query: Record<string, unknown>) => Promise<PaginatedResponse<unknown>>
  getById: (id: number) => Promise<unknown>
  update: (id: number, input: Record<string, unknown>) => Promise<unknown>
  remove: (id: number) => Promise<unknown>
}

const entities = [
  {
    label: "space",
    notFound: "Espaço não encontrado.",
    joins: 1,
    valid: {
      name: "Lab 01",
      floor: 1,
      capacity: 30,
      blocked: false,
      space_type_id: 2,
    },
    invalid: {
      name: "Lab 01",
      floor: 1,
      capacity: 0,
      blocked: false,
      space_type_id: 2,
    },
    partial: { capacity: 45 },
    create: spaceActions.createSpace,
    list: spaceActions.listSpaces,
    getById: spaceActions.getSpaceById,
    update: spaceActions.updateSpace,
    remove: spaceActions.removeSpace,
  },
  {
    label: "subject",
    notFound: "Disciplina não encontrada.",
    joins: 2,
    valid: { name: "Banco de Dados", required_space_type_id: 1, course_id: 2 },
    invalid: { name: "Banco de Dados", required_space_type_id: 1, course_id: 0 },
    partial: { name: "Banco de Dados II" },
    create: subjectActions.createSubject,
    list: subjectActions.listSubjects,
    getById: subjectActions.getSubjectById,
    update: subjectActions.updateSubject,
    remove: subjectActions.removeSubject,
  },
  {
    label: "class group",
    notFound: "Turma não encontrada.",
    joins: 2,
    valid: {
      name: "ADS 2024/1",
      semester: "2024.1",
      module: "1",
      student_count: 30,
      shift_id: 1,
      course_id: 2,
    },
    invalid: {
      name: "",
      semester: "2024.1",
      module: "1",
      student_count: 30,
      shift_id: 1,
      course_id: 2,
    },
    partial: { student_count: 40 },
    create: classGroupActions.createClassGroup,
    list: classGroupActions.listClassGroups,
    getById: classGroupActions.getClassGroupById,
    update: classGroupActions.updateClassGroup,
    remove: classGroupActions.removeClassGroup,
  },
  {
    label: "schedule",
    notFound: "Horário não encontrado.",
    joins: 1,
    valid: {
      weekday: "Monday",
      start_time: "07:30",
      end_time: "09:10",
      shift_id: 1,
    },
    invalid: {
      weekday: "Monday",
      start_time: "99:99",
      end_time: "09:10",
      shift_id: 1,
    },
    partial: { end_time: "10:00" },
    create: scheduleActions.createSchedule,
    list: scheduleActions.listSchedules,
    getById: scheduleActions.getScheduleById,
    update: scheduleActions.updateSchedule,
    remove: scheduleActions.removeSchedule,
  },
  {
    label: "schedule teacher",
    notFound: "Disponibilidade não encontrada.",
    joins: 2,
    valid: { schedule_id: 1, teacher_id: 2 },
    invalid: { schedule_id: 0, teacher_id: 2 },
    partial: { teacher_id: 5 },
    create: scheduleTeacherActions.createScheduleTeacher,
    list: scheduleTeacherActions.listScheduleTeachers,
    getById: scheduleTeacherActions.getScheduleTeacherById,
    update: scheduleTeacherActions.updateScheduleTeacher,
    remove: scheduleTeacherActions.removeScheduleTeacher,
  },
] as unknown as CrudEntityUnderTest[]

beforeEach(() => {
  resetMockDb(mockDb)
})

describe.each(entities)(
  "$label actions",
  ({ notFound, joins, valid, invalid, partial, create, list, getById, update, remove }) => {
    const row = { id: 11, ...valid }

    describe("create", () => {
      it("inserts the validated payload and returns the row with relations", async () => {
        queueResults(mockDb.insert, [{ id: 11 }])
        queueResults(mockDb.select, [row])

        await expect(create(valid)).resolves.toEqual(row)
        expect(chainOf(mockDb.insert).argsFor("values")).toEqual([valid])
      })

      it("rejects an invalid payload without hitting the database", async () => {
        await expect(create(invalid)).rejects.toBeInstanceOf(ZodError)
        expect(mockDb.insert).not.toHaveBeenCalled()
      })
    })

    describe("list", () => {
      it("returns the rows with the pagination metadata", async () => {
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

      it("joins the related tables and orders the result", async () => {
        queueResults(mockDb.select, [], [{ value: 0 }])

        await list({})

        const rowsQuery = chainOf(mockDb.select, 0)
        expect(rowsQuery.callCount("leftJoin")).toBe(joins)
        expect(rowsQuery.argsFor("orderBy")).toBeDefined()
      })

      it("translates page and limit into limit/offset", async () => {
        queueResults(mockDb.select, [], [{ value: 100 }])

        const result = await list({ page: 4, limit: 20 })

        const rowsQuery = chainOf(mockDb.select, 0)
        expect(rowsQuery.argsFor("limit")).toEqual([20])
        expect(rowsQuery.argsFor("offset")).toEqual([60])
        expect(result.pagination).toMatchObject({
          currentPage: 4,
          totalPages: 5,
          hasNextPage: true,
          hasPrevPage: true,
        })
      })

      it("returns an empty page when nothing matches", async () => {
        queueResults(mockDb.select, [], [{ value: 0 }])

        const result = await list({})

        expect(result.content).toEqual([])
        expect(result.pagination.totalPages).toBe(0)
      })

      it("rejects an invalid pagination value", async () => {
        await expect(list({ page: 0 })).rejects.toBeInstanceOf(ZodError)
      })
    })

    describe("getById", () => {
      it("returns the row", async () => {
        queueResults(mockDb.select, [row])

        await expect(getById(11)).resolves.toEqual(row)
        expect(chainOf(mockDb.select).argsFor("limit")).toEqual([1])
      })

      it("throws NotFoundError with the legacy message", async () => {
        queueResults(mockDb.select, [])

        await expect(getById(404)).rejects.toThrow(new NotFoundError(notFound))
      })
    })

    describe("update", () => {
      it("writes only the supplied fields", async () => {
        queueResults(mockDb.select, [{ id: 11 }], [row])
        queueResults(mockDb.update, undefined)

        await expect(update(11, partial)).resolves.toEqual(row)
        expect(chainOf(mockDb.update).argsFor("set")).toEqual([partial])
      })

      it("skips the update statement for an empty payload", async () => {
        queueResults(mockDb.select, [{ id: 11 }], [row])

        await expect(update(11, {})).resolves.toEqual(row)
        expect(mockDb.update).not.toHaveBeenCalled()
      })

      it("throws NotFoundError before writing anything", async () => {
        queueResults(mockDb.select, [])

        await expect(update(404, partial)).rejects.toThrow(NotFoundError)
        expect(mockDb.update).not.toHaveBeenCalled()
      })
    })

    describe("remove", () => {
      it("deletes the row and returns it", async () => {
        queueResults(mockDb.select, [row])
        queueResults(mockDb.delete, undefined)

        await expect(remove(11)).resolves.toEqual(row)
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

describe("entity specific filters", () => {
  it("filters spaces by blocked=false instead of dropping it", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await spaceActions.listSpaces({ blocked: "false" })

    expect(chainOf(mockDb.select, 0).argsFor("where")?.[0]).toBeDefined()
  })

  it("filters spaces by floor zero", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await spaceActions.listSpaces({ floor: 0 })

    expect(chainOf(mockDb.select, 0).argsFor("where")?.[0]).toBeDefined()
  })

  it("rejects a malformed time filter on schedules", async () => {
    await expect(
      scheduleActions.listSchedules({ start_time: "7h" }),
    ).rejects.toBeInstanceOf(ZodError)
    expect(mockDb.select).not.toHaveBeenCalled()
  })

  it("filters schedule teachers by teacher", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await scheduleTeacherActions.listScheduleTeachers({ teacher_id: "4" })

    expect(chainOf(mockDb.select, 0).argsFor("where")?.[0]).toBeDefined()
  })
})
