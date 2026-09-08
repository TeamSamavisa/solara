import { findConflicts } from "@/timetable/conflicts"
import { slotToRow } from "@/timetable/grid"
import { prepareTimetable } from "@/timetable/model"
import { createState } from "@/timetable/placement"
import { buildInput } from "@test/support/timetable"

/** Rows that actually carry a schedule in the fixture. */
const FIRST_SLOT = slotToRow("Monday", 7) as number
const SECOND_SLOT = slotToRow("Monday", 8) as number

/** Puts two allocations on the same row so they collide. */
function collide(sharedField: "teacher_id" | "class_group_id") {
  const input = buildInput()
  const prepared = prepareTimetable({
    ...input,
    class_allocations: input.class_allocations.map((allocation) => ({
      ...allocation,
      [sharedField]: sharedField === "teacher_id" ? 100 : 30,
    })),
  })
  const state = createState(prepared)

  // Same row, two classrooms: same time, so they clash.
  state.matrix[FIRST_SLOT][0] = 0
  state.matrix[FIRST_SLOT][1] = 1

  return { state, prepared }
}

describe("findConflicts", () => {
  it("finds nothing in an empty timetable", () => {
    const prepared = prepareTimetable(buildInput())
    const state = createState(prepared)

    expect(findConflicts(state.matrix, prepared)).toEqual([])
  })

  it("finds nothing when the classes do not overlap", () => {
    const prepared = prepareTimetable(buildInput())
    const state = createState(prepared)

    state.matrix[FIRST_SLOT][0] = 0
    state.matrix[SECOND_SLOT][1] = 1

    expect(findConflicts(state.matrix, prepared)).toEqual([])
  })

  it("reports a teacher booked twice at the same time", () => {
    const { state, prepared } = collide("teacher_id")

    const conflicts = findConflicts(state.matrix, prepared)

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({ scope: "teacher", name: "Ana Souza" })
  })

  it("reports a class group booked twice at the same time", () => {
    const { state, prepared } = collide("class_group_id")

    const conflicts = findConflicts(state.matrix, prepared)

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({
      scope: "class-group",
      name: "ADS 1",
    })
  })

  it("names both classes involved", () => {
    const { state, prepared } = collide("teacher_id")

    expect(findConflicts(state.matrix, prepared)[0].classes).toHaveLength(2)
  })

  it("says when the clash happens", () => {
    const { state, prepared } = collide("teacher_id")

    expect(findConflicts(state.matrix, prepared)[0].slot).toContain("Monday")
  })

  it("reports a clash once, not once per class involved", () => {
    const { state, prepared } = collide("teacher_id")

    expect(findConflicts(state.matrix, prepared)).toHaveLength(1)
  })

  it("reports a teacher scheduled outside their availability", () => {
    const input = buildInput()
    const prepared = prepareTimetable({
      ...input,
      // Ana only declared the first slot.
      teacher_schedules: { ...input.teacher_schedules, "100": [200] },
    })
    const state = createState(prepared)

    state.matrix[SECOND_SLOT][0] = 0

    expect(findConflicts(state.matrix, prepared)).toContainEqual(
      expect.objectContaining({ scope: "availability", name: "Ana Souza" }),
    )
  })

  it("leaves a teacher alone inside the availability they declared", () => {
    const input = buildInput()
    const prepared = prepareTimetable({
      ...input,
      teacher_schedules: { ...input.teacher_schedules, "100": [200] },
    })
    const state = createState(prepared)

    state.matrix[FIRST_SLOT][0] = 0

    expect(findConflicts(state.matrix, prepared)).toEqual([])
  })

  it("treats a teacher who declared nothing as always available", () => {
    const input = buildInput()
    const prepared = prepareTimetable({ ...input, teacher_schedules: {} })
    const state = createState(prepared)

    state.matrix[SECOND_SLOT][0] = 0

    expect(findConflicts(state.matrix, prepared)).toEqual([])
  })
})
