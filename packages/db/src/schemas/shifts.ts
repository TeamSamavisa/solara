import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { z } from "zod"

import {
  optionalTextFilter,
  paginationFields,
  requiredText,
  timestamps,
} from "./common"

export const shifts = mysqlTable("shifts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ...timestamps(),
})

export type Shift = typeof shifts.$inferSelect
export type NewShift = typeof shifts.$inferInsert

const shiftFields = {
  name: requiredText("Informe o nome do turno."),
}

export const createShiftSchema = z.object(shiftFields)
export const updateShiftSchema = z.object(shiftFields).partial()

export const listShiftsQuerySchema = z.object({
  ...paginationFields,
  name: optionalTextFilter,
})

export type CreateShiftInput = z.infer<typeof createShiftSchema>
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>
export type ListShiftsQuery = z.infer<typeof listShiftsQuerySchema>
