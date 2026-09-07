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
import { courses } from "./courses"
import { spaceTypes } from "./space-types"

export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  required_space_type_id: int("required_space_type_id").references(
    () => spaceTypes.id,
  ),
  course_id: int("course_id").references(() => courses.id),
  ...timestamps(),
})

export type Subject = typeof subjects.$inferSelect
export type NewSubject = typeof subjects.$inferInsert

const subjectFields = {
  name: requiredText("Informe o nome da disciplina."),
  required_space_type_id: requiredId("Selecione um tipo de espaço."),
  course_id: requiredId("Selecione um curso."),
}

export const createSubjectSchema = z.object(subjectFields)
export const updateSubjectSchema = z.object(subjectFields).partial()

export const listSubjectsQuerySchema = z.object({
  ...paginationFields,
  name: optionalTextFilter,
  required_space_type_id: optionalIdFilter,
  course_id: optionalIdFilter,
})

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>
export type ListSubjectsQuery = z.infer<typeof listSubjectsQuerySchema>
