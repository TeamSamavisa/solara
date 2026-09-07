import { ZodError } from "zod"

import {
  createAssignment,
  getAssignmentById,
  listAssignments,
  removeAssignment,
  updateAssignment,
  violatesAvailability,
} from "@/lib/db/actions/assignments"
import { db } from "@/lib/db/client"
import { NotFoundError } from "@/lib/db/errors"
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

const assignmentRow = {
  id: 10,
  teacher_id: 1,
  subject_id: 2,
  space_id: null,
  class_group_id: 3,
  duration: 2,
  teacher: { id: 1, full_name: "Ana Souza", email: "ana@example.com" },
  subject: { id: 2, name: "Banco de Dados" },
  space: null,
  classGroup: { id: 3, name: "ADS 2024/1", shift_id: 1 },
}

const scheduleRow = {
  assignment_id: 10,
  id: 7,
  weekday: "Monday",
  start_time: "07:30",
  end_time: "09:10",
  shift_id: 1,
}

const scheduleData = {
  id: scheduleRow.id,
  weekday: scheduleRow.weekday,
  start_time: scheduleRow.start_time,
  end_time: scheduleRow.end_time,
  shift_id: scheduleRow.shift_id,
}

beforeEach(() => {
  resetMockDb(mockDb)
})

describe("violatesAvailability", () => {
  const schedules = [scheduleData]

  it("is false when the assignment has no teacher", () => {
    expect(
      violatesAvailability({
        teacherId: null,
        classGroupShiftId: 1,
        schedules,
        availableScheduleIds: new Set(),
      }),
    ).toBe(false)
  })

  it("is false when the assignment has no schedules", () => {
    expect(
      violatesAvailability({
        teacherId: 1,
        classGroupShiftId: 1,
        schedules: [],
        availableScheduleIds: new Set(),
      }),
    ).toBe(false)
  })

  it("is true when a schedule belongs to another shift", () => {
    expect(
      violatesAvailability({
        teacherId: 1,
        classGroupShiftId: 2,
        schedules,
        availableScheduleIds: new Set([7]),
      }),
    ).toBe(true)
  })

  it("is true when the class group has no shift at all", () => {
    expect(
      violatesAvailability({
        teacherId: 1,
        classGroupShiftId: null,
        schedules,
        availableScheduleIds: new Set([7]),
      }),
    ).toBe(true)
  })

  it("is true when the teacher is not available in one of the schedules", () => {
    expect(
      violatesAvailability({
        teacherId: 1,
        classGroupShiftId: 1,
        schedules: [scheduleData, { ...scheduleData, id: 8 }],
        availableScheduleIds: new Set([7]),
      }),
    ).toBe(true)
  })

  it("is false when the teacher is available in every schedule", () => {
    expect(
      violatesAvailability({
        teacherId: 1,
        classGroupShiftId: 1,
        schedules: [scheduleData, { ...scheduleData, id: 8 }],
        availableScheduleIds: new Set([7, 8]),
      }),
    ).toBe(false)
  })

  it("is true when the teacher has no availability recorded", () => {
    expect(
      violatesAvailability({
        teacherId: 1,
        classGroupShiftId: 1,
        schedules,
        availableScheduleIds: new Set(),
      }),
    ).toBe(true)
  })
})

describe("createAssignment", () => {
  it("applies the default duration and a null space", async () => {
    queueResults(mockDb.insert, [{ id: 10 }])
    queueResults(mockDb.select, [assignmentRow], [])

    const result = await createAssignment({
      teacher_id: 1,
      subject_id: 2,
      class_group_id: 3,
    })

    expect(chainOf(mockDb.insert).argsFor("values")).toEqual([
      {
        teacher_id: 1,
        subject_id: 2,
        space_id: null,
        class_group_id: 3,
        duration: 2,
      },
    ])
    expect(result).toEqual({
      ...assignmentRow,
      schedules: [],
      violates_availability: false,
    })
  })

  it("keeps an explicit duration and space", async () => {
    queueResults(mockDb.insert, [{ id: 10 }])
    queueResults(mockDb.select, [assignmentRow], [])

    await createAssignment({
      teacher_id: 1,
      subject_id: 2,
      space_id: 4,
      class_group_id: 3,
      duration: 4,
    })

    const values = chainOf(mockDb.insert).argsFor("values")?.[0] as {
      duration: number
      space_id: number
    }
    expect(values.duration).toBe(4)
    expect(values.space_id).toBe(4)
  })

  it("links the supplied schedules inside a transaction", async () => {
    queueResults(mockDb.insert, [{ id: 10 }], undefined)
    queueResults(mockDb.select, [assignmentRow], [scheduleRow], [
      { teacher_id: 1, schedule_id: 7 },
    ])

    const result = await createAssignment({
      teacher_id: 1,
      subject_id: 2,
      class_group_id: 3,
      schedule_ids: [7, 8],
    })

    expect(mockDb.transaction).toHaveBeenCalledTimes(1)
    expect(chainOf(mockDb.insert, 1).argsFor("values")).toEqual([
      [
        { assignment_id: 10, schedule_id: 7 },
        { assignment_id: 10, schedule_id: 8 },
      ],
    ])
    expect(result.schedules).toEqual([scheduleData])
    expect(result.violates_availability).toBe(false)
  })

  it("does not touch the join table when no schedule is supplied", async () => {
    queueResults(mockDb.insert, [{ id: 10 }])
    queueResults(mockDb.select, [assignmentRow], [])

    await createAssignment({ teacher_id: 1, subject_id: 2, class_group_id: 3 })

    expect(mockDb.insert).toHaveBeenCalledTimes(1)
  })

  it("rejects an invalid payload before opening a transaction", async () => {
    await expect(
      createAssignment({ teacher_id: 0, subject_id: 2, class_group_id: 3 }),
    ).rejects.toBeInstanceOf(ZodError)

    expect(mockDb.transaction).not.toHaveBeenCalled()
  })

  it("rejects an empty schedule list", async () => {
    await expect(
      createAssignment({
        teacher_id: 1,
        subject_id: 2,
        class_group_id: 3,
        schedule_ids: [],
      }),
    ).rejects.toBeInstanceOf(ZodError)
  })
})

describe("getAssignmentById", () => {
  it("attaches the schedules and reports no violation", async () => {
    queueResults(mockDb.select, [assignmentRow], [scheduleRow], [
      { teacher_id: 1, schedule_id: 7 },
    ])

    await expect(getAssignmentById(10)).resolves.toEqual({
      ...assignmentRow,
      schedules: [scheduleData],
      violates_availability: false,
    })
  })

  it("reports a violation when the shift does not match the class group", async () => {
    queueResults(
      mockDb.select,
      [{ ...assignmentRow, classGroup: { id: 3, name: "T1", shift_id: 2 } }],
      [scheduleRow],
      [{ teacher_id: 1, schedule_id: 7 }],
    )

    const result = await getAssignmentById(10)

    expect(result.violates_availability).toBe(true)
  })

  it("reports a violation when the teacher is not available", async () => {
    queueResults(mockDb.select, [assignmentRow], [scheduleRow], [])

    const result = await getAssignmentById(10)

    expect(result.violates_availability).toBe(true)
  })

  it("skips the availability query when the assignment has no schedules", async () => {
    queueResults(mockDb.select, [assignmentRow], [])

    const result = await getAssignmentById(10)

    expect(mockDb.select).toHaveBeenCalledTimes(2)
    expect(result.violates_availability).toBe(false)
  })

  it("throws NotFoundError for an unknown assignment", async () => {
    queueResults(mockDb.select, [])

    await expect(getAssignmentById(404)).rejects.toThrow(
      new NotFoundError("Alocação não encontrada."),
    )
  })
})

describe("listAssignments", () => {
  it("returns the assignments with pagination metadata", async () => {
    queueResults(mockDb.select, [assignmentRow], [{ value: 1 }], [scheduleRow], [
      { teacher_id: 1, schedule_id: 7 },
    ])

    const result = await listAssignments({})

    expect(result.content).toEqual([
      {
        ...assignmentRow,
        schedules: [scheduleData],
        violates_availability: false,
      },
    ])
    expect(result.pagination).toMatchObject({
      currentPage: 1,
      totalItems: 1,
      totalPages: 1,
    })
  })

  it("groups the schedules per assignment", async () => {
    const otherRow = { ...assignmentRow, id: 11, teacher_id: 2 }
    queueResults(
      mockDb.select,
      [assignmentRow, otherRow],
      [{ value: 2 }],
      [scheduleRow, { ...scheduleRow, assignment_id: 11, id: 9 }],
      [
        { teacher_id: 1, schedule_id: 7 },
        { teacher_id: 2, schedule_id: 9 },
      ],
    )

    const result = await listAssignments({})

    expect(result.content[0].schedules).toEqual([scheduleData])
    expect(result.content[1].schedules).toEqual([
      { ...scheduleData, id: 9 },
    ])
    expect(result.content.every((row) => !row.violates_availability)).toBe(true)
  })

  it("skips the schedule queries when nothing matches", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    const result = await listAssignments({})

    expect(result.content).toEqual([])
    expect(mockDb.select).toHaveBeenCalledTimes(2)
  })

  it("paginates using limit and offset", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listAssignments({ page: 3, limit: 15 })

    const rowsQuery = chainOf(mockDb.select, 0)
    expect(rowsQuery.argsFor("limit")).toEqual([15])
    expect(rowsQuery.argsFor("offset")).toEqual([30])
  })

  it("filters by the foreign keys", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listAssignments({ teacher_id: 1, class_group_id: 3 })

    expect(chainOf(mockDb.select, 0).argsFor("where")?.[0]).toBeDefined()
  })

  it("filters by schedule through the join table", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listAssignments({ schedule_id: 7 })

    expect(chainOf(mockDb.select, 0).argsFor("where")?.[0]).toBeDefined()
  })

  it("builds no where clause when there are no filters", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listAssignments({})

    expect(chainOf(mockDb.select, 0).argsFor("where")).toEqual([undefined])
  })
})

describe("updateAssignment", () => {
  it("updates the scalar fields", async () => {
    queueResults(mockDb.select, [{ id: 10 }], [assignmentRow], [])
    queueResults(mockDb.update, undefined)

    await updateAssignment(10, { duration: 4 })

    expect(chainOf(mockDb.update).argsFor("set")).toEqual([{ duration: 4 }])
  })

  it("replaces the schedules", async () => {
    queueResults(mockDb.select, [{ id: 10 }], [assignmentRow], [scheduleRow], [
      { teacher_id: 1, schedule_id: 7 },
    ])
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)

    await updateAssignment(10, { schedule_ids: [7] })

    expect(mockDb.delete).toHaveBeenCalledTimes(1)
    expect(chainOf(mockDb.insert).argsFor("values")).toEqual([
      [{ assignment_id: 10, schedule_id: 7 }],
    ])
  })

  it("does not run an update statement when only schedules change", async () => {
    queueResults(mockDb.select, [{ id: 10 }], [assignmentRow], [])
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)

    await updateAssignment(10, { schedule_ids: [7] })

    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it("leaves the schedules untouched when they are not supplied", async () => {
    queueResults(mockDb.select, [{ id: 10 }], [assignmentRow], [])
    queueResults(mockDb.update, undefined)

    await updateAssignment(10, { duration: 3 })

    expect(mockDb.delete).not.toHaveBeenCalled()
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it("throws NotFoundError before writing anything", async () => {
    queueResults(mockDb.select, [])

    await expect(updateAssignment(404, { duration: 3 })).rejects.toThrow(
      new NotFoundError("Alocação não encontrada."),
    )
    expect(mockDb.transaction).not.toHaveBeenCalled()
  })

  it("rejects an invalid payload", async () => {
    await expect(updateAssignment(10, { duration: 0 })).rejects.toBeInstanceOf(
      ZodError,
    )
    expect(mockDb.select).not.toHaveBeenCalled()
  })
})

describe("removeAssignment", () => {
  it("removes the schedule links and the assignment itself", async () => {
    queueResults(mockDb.select, [assignmentRow])
    queueResults(mockDb.delete, undefined, undefined)

    await expect(removeAssignment(10)).resolves.toEqual(assignmentRow)
    expect(mockDb.transaction).toHaveBeenCalledTimes(1)
    expect(mockDb.delete).toHaveBeenCalledTimes(2)
  })

  it("throws NotFoundError and deletes nothing", async () => {
    queueResults(mockDb.select, [])

    await expect(removeAssignment(404)).rejects.toThrow(NotFoundError)
    expect(mockDb.delete).not.toHaveBeenCalled()
  })
})
