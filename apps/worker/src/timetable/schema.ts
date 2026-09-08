import { z } from "zod"

/**
 * Shape of the payload the web app sends to the worker. It mirrors the JSON
 * the legacy Python consumer parsed, so the producer side does not change.
 */

const id = z.number({ error: "Identificador inválido." }).int().positive()

const spaceTypeSchema = z.object({
  id,
  name: z.string(),
})

const classroomSchema = z.object({
  id,
  name: z.string(),
  floor: z.number().int(),
  capacity: z.number().int(),
  blocked: z.boolean().default(false),
  space_type_id: id,
})

const courseTypeSchema = z.object({
  id,
  name: z.string(),
})

const courseSchema = z.object({
  id,
  name: z.string(),
  course_type_id: id.nullable().optional(),
})

const shiftSchema = z.object({
  id,
  name: z.string(),
})

const teacherSchema = z.object({
  id,
  full_name: z.string(),
})

const subjectSchema = z.object({
  id,
  name: z.string(),
  required_space_type_id: id,
  course_id: id.nullable().optional(),
})

const scheduleSchema = z.object({
  id,
  weekday: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  shift_id: id,
})

const classGroupSchema = z.object({
  id,
  name: z.string(),
  course_id: id.nullable().optional(),
  shift_id: id,
  student_count: z.number().int().nonnegative().optional(),
})

const classAllocationSchema = z.object({
  id,
  class_group_id: id,
  subject_id: id,
  teacher_id: id,
  // The web app defaults this to 2; a class always occupies at least one slot.
  duration: z.number().int().positive().default(1),
})

export const timetableInputSchema = z.object({
  space_types: z.array(spaceTypeSchema).default([]),
  classrooms: z.array(classroomSchema).default([]),
  course_types: z.array(courseTypeSchema).default([]),
  courses: z.array(courseSchema).default([]),
  shifts: z.array(shiftSchema).default([]),
  teachers: z.array(teacherSchema).default([]),
  subjects: z.array(subjectSchema).default([]),
  schedules: z.array(scheduleSchema).default([]),
  class_groups: z.array(classGroupSchema).default([]),
  class_allocations: z.array(classAllocationSchema).default([]),
  // Keys arrive as strings because they come from a JSON object.
  teacher_schedules: z
    .record(z.string(), z.array(z.number().int().positive()))
    .default({}),
})

export type TimetableInput = z.infer<typeof timetableInputSchema>
export type ClassroomInput = z.infer<typeof classroomSchema>
export type ScheduleInput = z.infer<typeof scheduleSchema>
