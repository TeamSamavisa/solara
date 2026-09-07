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
import { shifts } from "./shifts"

export const classGroups = mysqlTable("class_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  semester: varchar("semester", { length: 255 }).notNull(),
  module: varchar("module", { length: 255 }).notNull(),
  student_count: int("student_count").notNull(),
  shift_id: int("shift_id").references(() => shifts.id),
  course_id: int("course_id").references(() => courses.id),
  ...timestamps(),
})

export type ClassGroup = typeof classGroups.$inferSelect
export type NewClassGroup = typeof classGroups.$inferInsert

const classGroupFields = {
  name: requiredText("Informe o nome da turma."),
  semester: requiredText("Informe o semestre."),
  module: requiredText("Informe o módulo."),
  student_count: requiredId("O número de alunos deve ser maior que zero."),
  shift_id: requiredId("Selecione um turno."),
  course_id: requiredId("Selecione um curso."),
}

export const createClassGroupSchema = z.object(classGroupFields)
export const updateClassGroupSchema = z.object(classGroupFields).partial()

export const listClassGroupsQuerySchema = z.object({
  ...paginationFields,
  name: optionalTextFilter,
  semester: optionalTextFilter,
  module: optionalTextFilter,
  student_count: optionalIdFilter,
  shift_id: optionalIdFilter,
  course_id: optionalIdFilter,
})

export type CreateClassGroupInput = z.infer<typeof createClassGroupSchema>
export type UpdateClassGroupInput = z.infer<typeof updateClassGroupSchema>
export type ListClassGroupsQuery = z.infer<typeof listClassGroupsQuerySchema>
