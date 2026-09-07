import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { z } from "zod"

import {
  optionalTextFilter,
  paginationFields,
  requiredText,
  timestamps,
} from "./common"

export const spaceTypes = mysqlTable("space_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ...timestamps(),
})

export type SpaceType = typeof spaceTypes.$inferSelect
export type NewSpaceType = typeof spaceTypes.$inferInsert

const spaceTypeFields = {
  name: requiredText("Informe o nome do tipo de espaço."),
}

export const createSpaceTypeSchema = z.object(spaceTypeFields)
export const updateSpaceTypeSchema = z.object(spaceTypeFields).partial()

export const listSpaceTypesQuerySchema = z.object({
  ...paginationFields,
  name: optionalTextFilter,
})

export type CreateSpaceTypeInput = z.infer<typeof createSpaceTypeSchema>
export type UpdateSpaceTypeInput = z.infer<typeof updateSpaceTypeSchema>
export type ListSpaceTypesQuery = z.infer<typeof listSpaceTypesQuerySchema>
