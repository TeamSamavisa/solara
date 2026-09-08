import {
  applyOptimizedSchedule,
  clearAllocations,
  collectTimetableData,
  getAllocationStatistics,
} from "@/actions/timetabling"
import { db } from "@/client"
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

beforeEach(() => {
  resetMockDb(mockDb)
})

/**
 * `collectTimetableData` issues its reads in a fixed order, so the mock
 * results are queued to match it.
 */
function queueCollect(overrides: Partial<Record<string, unknown[]>> = {}) {
  queueResults(
    mockDb.select,
    overrides.spaceTypes ?? [{ id: 1, name: "Sala" }],
    overrides.classrooms ?? [
      {
        id: 10,
        name: "S1",
        floor: 1,
        capacity: 40,
        blocked: false,
        space_type_id: 1,
      },
    ],
    overrides.courseTypes ?? [{ id: 1, name: "Tec" }],
    overrides.courses ?? [{ id: 1, name: "ADS", course_type_id: 1 }],
    overrides.shifts ?? [{ id: 1, name: "Matutino" }],
    overrides.teachers ?? [{ id: 100, full_name: "Ana" }],
    overrides.subjects ?? [
      { id: 20, name: "BD", required_space_type_id: 1, course_id: 1 },
    ],
    overrides.schedules ?? [
      {
        id: 200,
        weekday: "Monday",
        start_time: "07:00",
        end_time: "08:00",
        shift_id: 1,
      },
    ],
    overrides.classGroups ?? [
      { id: 30, name: "T1", course_id: 1, shift_id: 1, student_count: 30 },
    ],
    overrides.allocations ?? [
      {
        id: 300,
        class_group_id: 30,
        subject_id: 20,
        teacher_id: 100,
        duration: 2,
      },
    ],
    overrides.teacherSchedules ?? [{ teacher_id: 100, schedule_id: 200 }],
  )
}

describe("collectTimetableData", () => {
  it("returns every collection the worker expects", async () => {
    queueCollect()

    const data = await collectTimetableData()

    expect(Object.keys(data).sort()).toEqual(
      [
        "class_allocations",
        "class_groups",
        "classrooms",
        "course_types",
        "courses",
        "schedules",
        "shifts",
        "space_types",
        "subjects",
        "teacher_schedules",
        "teachers",
      ].sort(),
    )
  })

  it("groups teacher availability by teacher id", async () => {
    queueCollect({
      teacherSchedules: [
        { teacher_id: 100, schedule_id: 200 },
        { teacher_id: 100, schedule_id: 201 },
        { teacher_id: 101, schedule_id: 200 },
      ],
    })

    const data = await collectTimetableData()

    expect(data.teacher_schedules).toEqual({
      "100": [200, 201],
      "101": [200],
    })
  })

  it("uses string keys, since the payload travels as JSON", async () => {
    queueCollect()

    const data = await collectTimetableData()

    expect(Object.keys(data.teacher_schedules)).toEqual(["100"])
  })

  it("returns an empty map when nobody declared availability", async () => {
    queueCollect({ teacherSchedules: [] })

    const data = await collectTimetableData()

    expect(data.teacher_schedules).toEqual({})
  })

  it("passes the allocations through unchanged", async () => {
    queueCollect()

    const data = await collectTimetableData()

    expect(data.class_allocations).toEqual([
      {
        id: 300,
        class_group_id: 30,
        subject_id: 20,
        teacher_id: 100,
        duration: 2,
      },
    ])
  })

  it("survives a database with nothing in it", async () => {
    queueCollect({
      spaceTypes: [],
      classrooms: [],
      courseTypes: [],
      courses: [],
      shifts: [],
      teachers: [],
      subjects: [],
      schedules: [],
      classGroups: [],
      allocations: [],
      teacherSchedules: [],
    })

    const data = await collectTimetableData()

    expect(data.class_allocations).toEqual([])
    expect(data.teacher_schedules).toEqual({})
  })
})

describe("applyOptimizedSchedule", () => {
  const entry = {
    allocation_id: 300,
    schedule_ids: [200, 201],
    classroom: { id: 10 },
  }

  it("does nothing when the optimizer returned no placements", async () => {
    await expect(applyOptimizedSchedule([])).resolves.toEqual({
      updated: 0,
      linkedSchedules: 0,
    })
    expect(mockDb.transaction).not.toHaveBeenCalled()
  })

  it("assigns the classroom and relinks the schedules", async () => {
    queueResults(mockDb.update, undefined)
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)

    const result = await applyOptimizedSchedule([entry])

    expect(result).toEqual({ updated: 1, linkedSchedules: 2 })
    expect(chainOf(mockDb.update).argsFor("set")).toEqual([{ space_id: 10 }])
    expect(chainOf(mockDb.insert).argsFor("values")).toEqual([
      [
        { assignment_id: 300, schedule_id: 200 },
        { assignment_id: 300, schedule_id: 201 },
      ],
    ])
  })

  it("runs inside a single transaction", async () => {
    queueResults(mockDb.update, undefined)
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)

    await applyOptimizedSchedule([entry])

    expect(mockDb.transaction).toHaveBeenCalledTimes(1)
  })

  it("clears the previous links even when no new slot was found", async () => {
    queueResults(mockDb.update, undefined)
    queueResults(mockDb.delete, undefined)

    const result = await applyOptimizedSchedule([
      { ...entry, schedule_ids: [] },
    ])

    expect(mockDb.delete).toHaveBeenCalledTimes(1)
    expect(mockDb.insert).not.toHaveBeenCalled()
    expect(result.linkedSchedules).toBe(0)
  })

  it("leaves the classroom untouched when the optimizer did not pick one", async () => {
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)

    await applyOptimizedSchedule([{ ...entry, classroom: undefined }])

    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it("skips an entry without a usable allocation id", async () => {
    const result = await applyOptimizedSchedule([
      { ...entry, allocation_id: 0 },
    ])

    expect(result.updated).toBe(0)
  })
})

describe("getAllocationStatistics", () => {
  it("derives how many allocations still lack a time slot", async () => {
    queueResults(mockDb.select, [{ total: 10, scheduled: 4 }])

    await expect(getAllocationStatistics()).resolves.toEqual({
      total: 10,
      scheduled: 4,
      pending: 6,
    })
  })

  it("copes with MySQL returning the counts as strings", async () => {
    queueResults(mockDb.select, [{ total: "10", scheduled: "4" }])

    await expect(getAllocationStatistics()).resolves.toEqual({
      total: 10,
      scheduled: 4,
      pending: 6,
    })
  })

  it("reports zeroes when there is no allocation at all", async () => {
    queueResults(mockDb.select, [])

    await expect(getAllocationStatistics()).resolves.toEqual({
      total: 0,
      scheduled: 0,
      pending: 0,
    })
  })

  it("counts every assignment once, even though the join fans out", async () => {
    queueResults(mockDb.select, [{ total: 1, scheduled: 1 }])

    await getAllocationStatistics()

    // A plain `count(*)` over the left join would multiply an assignment by
    // its number of linked schedules.
    const [projection] = mockDb.select.mock.calls[0] as [
      Record<string, { queryChunks?: unknown[] }>,
    ]

    expect(sqlTextOf(projection.total)).toContain("count(distinct")
    expect(sqlTextOf(projection.scheduled)).toContain("count(distinct")
  })
})

/** Flattens a drizzle `sql` fragment down to the literal text it carries. */
function sqlTextOf(fragment: { queryChunks?: unknown[] }): string {
  return (fragment.queryChunks ?? [])
    .flatMap((chunk) => {
      const value = (chunk as { value?: unknown }).value

      return Array.isArray(value) ? value : []
    })
    .join("")
}
describe("clearAllocations", () => {
  it("removes every schedule link", async () => {
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.update, undefined)

    await clearAllocations()

    expect(mockDb.delete).toHaveBeenCalledTimes(1)
    expect(chainOf(mockDb.delete).argsFor("where")).toBeUndefined()
  })

  it("frees the classroom of every assignment", async () => {
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.update, undefined)

    await clearAllocations()

    expect(chainOf(mockDb.update).argsFor("set")).toEqual([{ space_id: null }])
  })

  it("leaves the assignments themselves in place", async () => {
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.update, undefined)

    await clearAllocations()

    // Only the link table is emptied; the assignments are the user\u0027s data.
    expect(mockDb.delete).toHaveBeenCalledTimes(1)
  })

  it("runs in a single transaction", async () => {
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.update, undefined)

    await clearAllocations()

    expect(mockDb.transaction).toHaveBeenCalledTimes(1)
  })
})
