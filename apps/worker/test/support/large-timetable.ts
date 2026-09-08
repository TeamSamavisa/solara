import type { TimetableInput } from "@/timetable/schema"

/**
 * Builds a week close to real usage: three shifts, twelve class groups and
 * forty-eight classes spread over twelve rooms.
 */
export function buildLargeInput(): TimetableInput {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  const hoursByShift: [number, number[]][] = [
    [1, [7, 8, 9, 10]],
    [2, [13, 14, 15, 16]],
    [3, [19, 20, 21]],
  ]

  const schedules: TimetableInput["schedules"] = []
  let scheduleId = 1
  for (const weekday of days) {
    for (const [shiftId, hours] of hoursByShift) {
      for (const hour of hours) {
        schedules.push({
          id: scheduleId,
          weekday,
          start_time: `${String(hour).padStart(2, "0")}:00`,
          end_time: `${String(hour + 1).padStart(2, "0")}:00`,
          shift_id: shiftId,
        })
        scheduleId += 1
      }
    }
  }

  const teachers = Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    full_name: `Prof ${i + 1}`,
  }))

  return {
    space_types: [
      { id: 1, name: "Sala" },
      { id: 2, name: "Laboratório" },
    ],
    // Three of the twelve rooms are labs.
    classrooms: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: `S${i + 1}`,
      floor: 1,
      capacity: 40,
      blocked: false,
      space_type_id: i < 9 ? 1 : 2,
    })),
    course_types: [{ id: 1, name: "Tecnólogo" }],
    courses: [{ id: 1, name: "ADS", course_type_id: 1 }],
    shifts: [
      { id: 1, name: "Matutino" },
      { id: 2, name: "Vespertino" },
      { id: 3, name: "Noturno" },
    ],
    teachers,
    subjects: Array.from({ length: 24 }, (_, i) => ({
      id: i + 1,
      name: `Disciplina ${i + 1}`,
      required_space_type_id: i % 4 === 0 ? 2 : 1,
      course_id: 1,
    })),
    schedules,
    class_groups: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: `Turma ${i + 1}`,
      course_id: 1,
      shift_id: (i % 3) + 1,
      student_count: 35,
    })),
    class_allocations: Array.from({ length: 48 }, (_, i) => ({
      id: i + 1,
      class_group_id: (i % 12) + 1,
      subject_id: (i % 24) + 1,
      teacher_id: (i % 16) + 1,
      duration: i % 3 === 0 ? 2 : 1,
    })),
    teacher_schedules: Object.fromEntries(
      teachers.map((teacher) => [
        String(teacher.id),
        schedules.map((schedule) => schedule.id),
      ]),
    ),
  }
}
