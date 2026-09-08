import { prepareTimetable } from "@/timetable/model"
import { timetableInputSchema } from "@/timetable/schema"
import { buildInput } from "@test/support/timetable"

describe("timetableInputSchema", () => {
  it("accepts the payload the web app sends", () => {
    expect(timetableInputSchema.safeParse(buildInput()).success).toBe(true)
  })

  it("fills in every collection when the payload is empty", () => {
    const parsed = timetableInputSchema.parse({})

    expect(parsed.classrooms).toEqual([])
    expect(parsed.class_allocations).toEqual([])
    expect(parsed.teacher_schedules).toEqual({})
  })

  it("defaults a blocked flag that was left out", () => {
    const parsed = timetableInputSchema.parse({
      classrooms: [
        { id: 1, name: "S", floor: 0, capacity: 10, space_type_id: 1 },
      ],
    })

    expect(parsed.classrooms[0].blocked) .toBe(false)
  })

  it("defaults a missing duration to a single slot", () => {
    const parsed = timetableInputSchema.parse({
      class_allocations: [
        { id: 1, class_group_id: 1, subject_id: 1, teacher_id: 1 },
      ],
    })

    expect(parsed.class_allocations[0].duration).toBe(1)
  })

  it("rejects a non positive identifier", () => {
    const result = timetableInputSchema.safeParse({
      shifts: [{ id: 0, name: "X" }],
    })

    expect(result.success).toBe(false)
  })

  it("rejects a duration of zero", () => {
    const result = timetableInputSchema.safeParse({
      class_allocations: [
        {
          id: 1,
          class_group_id: 1,
          subject_id: 1,
          teacher_id: 1,
          duration: 0,
        },
      ],
    })

    expect(result.success).toBe(false)
  })
})

describe("prepareTimetable", () => {
  it("keeps classrooms in payload order, so a column maps to a room", () => {
    const prepared = prepareTimetable(buildInput())

    expect(prepared.classrooms.map((room) => room.id)).toEqual([10, 11])
  })

  it("resolves the relations of each allocation", () => {
    const prepared = prepareTimetable(buildInput())

    expect(prepared.allocations[0]).toMatchObject({
      id: 300,
      subjectName: "Banco de Dados",
      teacherName: "Ana Souza",
      classGroupName: "ADS 1",
      courseName: "ADS",
      shiftName: "Matutino",
    })
  })

  it("offers every compatible classroom as a column index", () => {
    const prepared = prepareTimetable(buildInput())

    // Both rooms are "Sala de Aula", which is what both subjects require.
    expect([...prepared.allocations[0].possibleClassrooms]).toEqual([0, 1])
  })

  it("excludes classrooms of the wrong space type", () => {
    const input = buildInput()
    input.classrooms[1].space_type_id = 2

    const prepared = prepareTimetable(input)

    expect([...prepared.allocations[0].possibleClassrooms]).toEqual([0])
  })

  it("excludes blocked classrooms", () => {
    const input = buildInput()
    input.classrooms[0].blocked = true

    const prepared = prepareTimetable(input)

    expect([...prepared.allocations[0].possibleClassrooms]).toEqual([1])
  })

  it("leaves an allocation with no compatible room, rather than dropping it", () => {
    const input = buildInput()
    input.classrooms.forEach((room) => (room.blocked = true))

    const prepared = prepareTimetable(input)

    expect(prepared.allocations).toHaveLength(2)
    expect(prepared.allocations[0].possibleClassrooms.size).toBe(0)
  })

  it("drops an allocation whose relations are missing", () => {
    const input = buildInput()
    input.class_allocations.push({
      id: 999,
      class_group_id: 30,
      subject_id: 9999,
      teacher_id: 100,
      duration: 1,
    })

    const prepared = prepareTimetable(input)

    expect(prepared.allocations.map((a) => a.id)).toEqual([300, 301])
  })

  it("indexes schedules by row and shift", () => {
    const prepared = prepareTimetable(buildInput())

    // Monday 07:00 is row 1 (06:00 is row 0), on shift 1.
    expect(prepared.scheduleByRowAndShift.get("1:1")).toBe(200)
    expect(prepared.scheduleByRow.get(1)).toBe(200)
  })

  it("ignores a schedule whose weekday is outside the grid", () => {
    const input = buildInput()
    input.schedules.push({
      id: 999,
      weekday: "Sunday",
      start_time: "07:00",
      end_time: "08:00",
      shift_id: 1,
    })

    const prepared = prepareTimetable(input)

    expect([...prepared.scheduleByRowAndShift.values()]).not.toContain(999)
  })

  it("converts teacher availability into lookup sets", () => {
    const prepared = prepareTimetable(buildInput())

    expect(prepared.teacherSchedules.get(100)?.has(200)).toBe(true)
    expect(prepared.teacherSchedules.get(100)?.has(999)).toBe(false)
  })

  it("handles a completely empty payload", () => {
    const prepared = prepareTimetable(timetableInputSchema.parse({}))

    expect(prepared.allocations).toEqual([])
    expect(prepared.classrooms).toEqual([])
  })
})
