import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { z } from "zod"

import {
  optionalIdFilter,
  optionalTextFilter,
  paginationFields,
  requiredId,
  requiredText,
  timestamps,
} from "./common"
import { courseTypes } from "./course-types"

export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  course_type_id: int("course_type_id").references(() => courseTypes.id),
  ...timestamps(),
})

export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert

const courseFields = {
  name: requiredText("Informe o nome do curso."),
  course_type_id: requiredId("Selecione um tipo de curso."),
}

export const createCourseSchema = z.object(courseFields)
export const updateCourseSchema = z.object(courseFields).partial()

export const listCoursesQuerySchema = z.object({
  ...paginationFields,
  name: optionalTextFilter,
  course_type_id: optionalIdFilter,
})

export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>
