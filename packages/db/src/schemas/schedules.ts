import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { z } from "zod"

import {
  optionalTextFilter,
  paginationFields,
  requiredInt,
  requiredText,
  TIME_PATTERN,
  timestamps,
} from "./common"
import { shifts } from "./shifts"

export const schedules = mysqlTable("schedules", {
  id: int("id").autoincrement().primaryKey(),
  weekday: varchar("weekday", { length: 255 }).notNull(),
  start_time: varchar("start_time", { length: 255 }).notNull(),
  end_time: varchar("end_time", { length: 255 }).notNull(),
  shift_id: int("shift_id")
    .notNull()
    .references(() => shifts.id),
  ...timestamps(),
})

export type Schedule = typeof schedules.$inferSelect
export type NewSchedule = typeof schedules.$inferInsert

const scheduleFields = {
  weekday: requiredText("Selecione o dia da semana."),
  start_time: z
    .string({ error: "Informe o horário de início." })
    .regex(TIME_PATTERN, {
      error: "O horário de início deve estar no formato HH:MM.",
    }),
  end_time: z
    .string({ error: "Informe o horário de término." })
    .regex(TIME_PATTERN, {
      error: "O horário de término deve estar no formato HH:MM.",
    }),
  // The legacy DTO only required an integer here, not a positive one.
  shift_id: requiredInt("Selecione um turno."),
}

export const createScheduleSchema = z.object(scheduleFields)
export const updateScheduleSchema = z.object(scheduleFields).partial()

export const listSchedulesQuerySchema = z.object({
  ...paginationFields,
  weekday: optionalTextFilter,
  start_time: z
    .string()
    .regex(TIME_PATTERN, { error: "Use o formato HH:MM." })
    .optional(),
  end_time: z
    .string()
    .regex(TIME_PATTERN, { error: "Use o formato HH:MM." })
    .optional(),
})

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>
export type ListSchedulesQuery = z.infer<typeof listSchedulesQuerySchema>
