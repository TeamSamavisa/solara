import { optimizeTimetable } from "@/timetable/optimize"
import { createRandom } from "@/timetable/random"
import { timetableInputSchema } from "@/timetable/schema"
import { buildLargeInput } from "@test/support/large-timetable"

/**
 * Guards the properties that only break at scale: the small fixtures used
 * elsewhere would pass even with an optimizer that barely works.
 */
describe("optimizing a full week", () => {
  const outcome = optimizeTimetable(buildLargeInput(), {
    random: createRandom(1),
    annealingIterations: 150,
  })

  it("places every class", () => {
    expect(outcome.statistics.placed_allocations).toBe(48)
    expect(outcome.unplaced).toEqual([])
  })

  it("satisfies every hard constraint", () => {
    expect(outcome.statistics.hard_constraints_satisfied).toBe(true)
    expect(outcome.statistics.hard_constraints_cost).toBe(0)
  })

  it("gives every class as many time slots as its duration", () => {
    for (const entry of outcome.schedule) {
      expect(entry.schedule_ids).toHaveLength(entry.duration)
    }
  })

  it("never books a teacher twice in the same slot", () => {
    const seen = new Set<string>()

    for (const entry of outcome.schedule) {
      for (const scheduleId of entry.schedule_ids) {
        const key = `${entry.teacher.id}:${scheduleId}`
        expect(seen.has(key)).toBe(false)
        seen.add(key)
      }
    }
  })

  it("never books a class group twice in the same slot", () => {
    const seen = new Set<string>()

    for (const entry of outcome.schedule) {
      for (const scheduleId of entry.schedule_ids) {
        const key = `${entry.class_group.id}:${scheduleId}`
        expect(seen.has(key)).toBe(false)
        seen.add(key)
      }
    }
  })

  it("never books a classroom twice in the same slot", () => {
    const seen = new Set<string>()

    for (const entry of outcome.schedule) {
      for (const scheduleId of entry.schedule_ids) {
        const key = `${entry.classroom.id}:${scheduleId}`
        expect(seen.has(key)).toBe(false)
        seen.add(key)
      }
    }
  })

  it("only uses slots belonging to each group's own shift", () => {
    const input = buildLargeInput()
    const shiftBySchedule = new Map(
      input.schedules.map((schedule) => [schedule.id, schedule.shift_id]),
    )

    for (const entry of outcome.schedule) {
      for (const scheduleId of entry.schedule_ids) {
        expect(shiftBySchedule.get(scheduleId)).toBe(entry.class_group.shift_id)
      }
    }
  })
})

describe("optimizing an impossible week", () => {
  it("places what fits and reports the rest instead of hanging", () => {
    const input = timetableInputSchema.parse({
      space_types: [{ id: 1, name: "Sala" }],
      classrooms: [
        {
          id: 1,
          name: "S1",
          floor: 1,
          capacity: 30,
          blocked: false,
          space_type_id: 1,
        },
      ],
      course_types: [{ id: 1, name: "T" }],
      courses: [{ id: 1, name: "C", course_type_id: 1 }],
      shifts: [{ id: 1, name: "Matutino" }],
      teachers: [{ id: 1, full_name: "Único" }],
      subjects: [
        { id: 1, name: "D", required_space_type_id: 1, course_id: 1 },
      ],
      schedules: [1, 2, 3].map((hour) => ({
        id: hour,
        weekday: "Monday",
        start_time: `0${6 + hour}:00`,
        end_time: `0${7 + hour}:00`,
        shift_id: 1,
      })),
      class_groups: [
        { id: 1, name: "T1", course_id: 1, shift_id: 1, student_count: 10 },
      ],
      // Ten classes for one teacher, one room and three slots.
      class_allocations: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        class_group_id: 1,
        subject_id: 1,
        teacher_id: 1,
        duration: 1,
      })),
      teacher_schedules: { "1": [1, 2, 3] },
    })

    const outcome = optimizeTimetable(input, {
      random: createRandom(1),
      annealingIterations: 20,
    })

    expect(outcome.statistics.placed_allocations).toBe(3)
    expect(outcome.unplaced).toHaveLength(7)
    expect(outcome.statistics.hard_constraints_cost).toBe(0)
  })
})
