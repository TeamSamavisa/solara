import { int, mysqlTable } from "drizzle-orm/mysql-core"
import { z } from "zod"

import {
  optionalIdFilter,
  paginationFields,
  requiredId,
  timestamps,
} from "./common"
import { schedules } from "./schedules"
import { users } from "./users"

export const scheduleTeachers = mysqlTable("schedule_teachers", {
  id: int("id").autoincrement().primaryKey(),
  schedule_id: int("schedule_id").references(() => schedules.id),
  teacher_id: int("teacher_id").references(() => users.id),
  ...timestamps(),
})

export type ScheduleTeacher = typeof scheduleTeachers.$inferSelect
export type NewScheduleTeacher = typeof scheduleTeachers.$inferInsert

const scheduleTeacherFields = {
  schedule_id: requiredId("Selecione um horário."),
  teacher_id: requiredId("Selecione um professor."),
}

export const createScheduleTeacherSchema = z.object(scheduleTeacherFields)
export const updateScheduleTeacherSchema = z
  .object(scheduleTeacherFields)
  .partial()

export const listScheduleTeachersQuerySchema = z.object({
  ...paginationFields,
  schedule_id: optionalIdFilter,
  teacher_id: optionalIdFilter,
})

export type CreateScheduleTeacherInput = z.infer<
  typeof createScheduleTeacherSchema
>
export type UpdateScheduleTeacherInput = z.infer<
  typeof updateScheduleTeacherSchema
>
export type ListScheduleTeachersQuery = z.infer<
  typeof listScheduleTeachersQuerySchema
>
