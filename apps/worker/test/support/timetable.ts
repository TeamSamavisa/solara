import type { TimetableInput } from "@/timetable/schema"

/**
 * Builds a small but complete payload: two class groups on the morning shift,
 * two teachers, two classrooms of the same type, and Monday/Tuesday schedules.
 * Individual tests override just the slice they care about.
 */
export function buildInput(
  overrides: Partial<TimetableInput> = {},
): TimetableInput {
  const base: TimetableInput = {
    space_types: [
      { id: 1, name: "Sala de Aula" },
      { id: 2, name: "Laboratório" },
    ],
    classrooms: [
      {
        id: 10,
        name: "Sala 101",
        floor: 1,
        capacity: 40,
        blocked: false,
        space_type_id: 1,
      },
      {
        id: 11,
        name: "Sala 102",
        floor: 1,
        capacity: 40,
        blocked: false,
        space_type_id: 1,
      },
    ],
    course_types: [{ id: 1, name: "Tecnólogo" }],
    courses: [{ id: 1, name: "ADS", course_type_id: 1 }],
    shifts: [{ id: 1, name: "Matutino" }],
    teachers: [
      { id: 100, full_name: "Ana Souza" },
      { id: 101, full_name: "Bruno Lima" },
    ],
    subjects: [
      {
        id: 20,
        name: "Banco de Dados",
        required_space_type_id: 1,
        course_id: 1,
      },
      { id: 21, name: "Redes", required_space_type_id: 1, course_id: 1 },
    ],
    schedules: [
      {
        id: 200,
        weekday: "Monday",
        start_time: "07:00",
        end_time: "08:00",
        shift_id: 1,
      },
      {
        id: 201,
        weekday: "Monday",
        start_time: "08:00",
        end_time: "09:00",
        shift_id: 1,
      },
      {
        id: 202,
        weekday: "Tuesday",
        start_time: "07:00",
        end_time: "08:00",
        shift_id: 1,
      },
      {
        id: 203,
        weekday: "Tuesday",
        start_time: "08:00",
        end_time: "09:00",
        shift_id: 1,
      },
    ],
    class_groups: [
      {
        id: 30,
        name: "ADS 1",
        course_id: 1,
        shift_id: 1,
        student_count: 30,
      },
      {
        id: 31,
        name: "ADS 2",
        course_id: 1,
        shift_id: 1,
        student_count: 30,
      },
    ],
    class_allocations: [
      {
        id: 300,
        class_group_id: 30,
        subject_id: 20,
        teacher_id: 100,
        duration: 1,
      },
      {
        id: 301,
        class_group_id: 31,
        subject_id: 21,
        teacher_id: 101,
        duration: 1,
      },
    ],
    // Both teachers are available in every declared schedule.
    teacher_schedules: {
      "100": [200, 201, 202, 203],
      "101": [200, 201, 202, 203],
    },
  }

  return { ...base, ...overrides }
}
