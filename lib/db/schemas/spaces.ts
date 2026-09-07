import { boolean, int, mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { z } from "zod"

import {
  optionalBooleanFilter,
  optionalIdFilter,
  optionalTextFilter,
  paginationFields,
  requiredId,
  requiredInt,
  requiredText,
  timestamps,
} from "./common"
import { spaceTypes } from "./space-types"

export const spaces = mysqlTable("spaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  floor: int("floor").notNull(),
  capacity: int("capacity").notNull(),
  blocked: boolean("blocked").default(false),
  space_type_id: int("space_type_id").references(() => spaceTypes.id),
  ...timestamps(),
})

export type Space = typeof spaces.$inferSelect
export type NewSpace = typeof spaces.$inferInsert

const spaceFields = {
  name: requiredText("Informe o nome do espaço."),
  floor: requiredInt("O andar deve ser um número inteiro."),
  capacity: requiredId("A capacidade deve ser maior que zero."),
  blocked: z.boolean({ error: "Informe se o espaço está bloqueado." }),
  space_type_id: requiredId("Selecione um tipo de espaço."),
}

export const createSpaceSchema = z.object(spaceFields)
export const updateSpaceSchema = z.object(spaceFields).partial()

export const listSpacesQuerySchema = z.object({
  ...paginationFields,
  name: optionalTextFilter,
  // The legacy filter allowed any integer here, including 0 and negatives.
  floor: z.coerce.number().int().optional(),
  capacity: optionalIdFilter,
  blocked: optionalBooleanFilter,
  space_type_id: optionalIdFilter,
})

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>
export type ListSpacesQuery = z.infer<typeof listSpacesQuerySchema>
