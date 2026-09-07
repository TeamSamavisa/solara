import type { AssignmentWithRelations } from "@solara/db/actions/assignments"
import { buildTimetable, slotLabel } from "@/lib/timetable"

function assignment(
  overrides: Partial<AssignmentWithRelations> = {},
): AssignmentWithRelations {
  return {
    id: 1,
    teacher_id: 1,
    subject_id: 2,
    space_id: 3,
    class_group_id: 4,
    duration: 2,
    teacher: { id: 1, full_name: "Ana Souza", email: "ana@example.com" },
    subject: { id: 2, name: "Banco de Dados" },
    space: { id: 3, name: "Lab 1" },
    classGroup: { id: 4, name: "ADS", shift_id: 1 },
    schedules: [],
    violates_availability: false,
    ...overrides,
  } as unknown as AssignmentWithRelations
}

function schedule(
  id: number,
  weekday: string,
  start: string,
  end: string,
) {
  return { id, weekday, start_time: start, end_time: end, shift_id: 1 }
}

describe("buildTimetable slots", () => {
  it("has no slots without assignments", () => {
    expect(buildTimetable([])).toEqual({
      slots: [],
      grid: expect.any(Object),
    })
  })

  it("collects each distinct time range once", () => {
    const result = buildTimetable([
      assignment({
        schedules: [
          schedule(1, "Monday", "07:30", "09:10"),
          schedule(2, "Tuesday", "07:30", "09:10"),
        ],
      }),
    ])

    expect(result.slots).toEqual(["07:30 - 09:10"])
  })

  it("orders the slots chronologically, not alphabetically", () => {
    const result = buildTimetable([
      assignment({
        schedules: [
          schedule(1, "Monday", "10:00", "11:40"),
          schedule(2, "Monday", "7:30", "9:10"),
          schedule(3, "Monday", "13:00", "14:40"),
        ],
      }),
    ])

    // A plain string sort would put "10:00" before "7:30".
    expect(result.slots).toEqual([
      "7:30 - 9:10",
      "10:00 - 11:40",
      "13:00 - 14:40",
    ])
  })

  it("keeps ranges that start together but end apart", () => {
    const result = buildTimetable([
      assignment({
        schedules: [
          schedule(1, "Monday", "07:30", "09:10"),
          schedule(2, "Monday", "07:30", "08:20"),
        ],
      }),
    ])

    expect(result.slots).toEqual(["07:30 - 08:20", "07:30 - 09:10"])
  })
})

describe("buildTimetable grid", () => {
  it("places a class in the matching weekday and slot", () => {
    const result = buildTimetable([
      assignment({ schedules: [schedule(1, "Wednesday", "10:00", "11:40")] }),
    ])

    expect(result.grid.Wednesday["10:00 - 11:40"]).toEqual([
      {
        subject: "Banco de Dados",
        teacher: "Ana Souza",
        space: "Lab 1",
        violatesAvailability: false,
      },
    ])
  })

  it("leaves the other cells empty", () => {
    const result = buildTimetable([
      assignment({ schedules: [schedule(1, "Wednesday", "10:00", "11:40")] }),
    ])

    expect(result.grid.Monday["10:00 - 11:40"]).toEqual([])
  })

  it("repeats a class across every schedule it occupies", () => {
    const result = buildTimetable([
      assignment({
        schedules: [
          schedule(1, "Monday", "07:30", "09:10"),
          schedule(2, "Friday", "07:30", "09:10"),
        ],
      }),
    ])

    expect(result.grid.Monday["07:30 - 09:10"]).toHaveLength(1)
    expect(result.grid.Friday["07:30 - 09:10"]).toHaveLength(1)
  })

  it("stacks classes that share a cell", () => {
    const slot = schedule(1, "Monday", "07:30", "09:10")
    const result = buildTimetable([
      assignment({ id: 1, schedules: [slot] }),
      assignment({
        id: 2,
        subject: { id: 9, name: "Redes" },
        schedules: [slot],
      } as never),
    ])

    expect(result.grid.Monday["07:30 - 09:10"]).toHaveLength(2)
    expect(
      result.grid.Monday["07:30 - 09:10"].map((cell) => cell.subject),
    ).toEqual(["Banco de Dados", "Redes"])
  })

  it("carries the availability violation into the cell", () => {
    const result = buildTimetable([
      assignment({
        violates_availability: true,
        schedules: [schedule(1, "Monday", "07:30", "09:10")],
      }),
    ])

    expect(result.grid.Monday["07:30 - 09:10"][0].violatesAvailability).toBe(
      true,
    )
  })

  it("falls back to a placeholder for missing relations", () => {
    const result = buildTimetable([
      assignment({
        teacher: null,
        space: null,
        subject: null,
        schedules: [schedule(1, "Monday", "07:30", "09:10")],
      } as never),
    ])

    expect(result.grid.Monday["07:30 - 09:10"][0]).toMatchObject({
      subject: "—",
      teacher: "—",
      space: "—",
    })
  })

  it("ignores a weekday that is not printed, such as Sunday", () => {
    const result = buildTimetable([
      assignment({ schedules: [schedule(1, "Sunday", "07:30", "09:10")] }),
    ])

    expect(result.slots).toEqual(["07:30 - 09:10"])
    expect(result.grid.Sunday).toBeUndefined()
  })

  it("ignores an assignment without schedules", () => {
    const result = buildTimetable([assignment({ schedules: [] })])

    expect(result.slots).toEqual([])
  })
})

describe("slotLabel", () => {
  it("joins the range the way the grid rows are keyed", () => {
    expect(slotLabel("07:30", "09:10")).toBe("07:30 - 09:10")
  })
})
