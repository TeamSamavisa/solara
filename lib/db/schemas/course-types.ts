import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { z } from "zod"

import {
  optionalTextFilter,
  paginationFields,
  requiredText,
  timestamps,
} from "./common"

export const courseTypes = mysqlTable("course_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ...timestamps(),
})

export type CourseType = typeof courseTypes.$inferSelect
export type NewCourseType = typeof courseTypes.$inferInsert

const courseTypeFields = {
  name: requiredText("Informe o nome do tipo de curso."),
}

export const createCourseTypeSchema = z.object(courseTypeFields)
export const updateCourseTypeSchema = z.object(courseTypeFields).partial()

export const listCourseTypesQuerySchema = z.object({
  ...paginationFields,
  name: optionalTextFilter,
})

export type CreateCourseTypeInput = z.infer<typeof createCourseTypeSchema>
export type UpdateCourseTypeInput = z.infer<typeof updateCourseTypeSchema>
export type ListCourseTypesQuery = z.infer<typeof listCourseTypesQuerySchema>
