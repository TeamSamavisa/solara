import { int, mysqlTable } from "drizzle-orm/mysql-core"
import { z } from "zod"

import { classGroups } from "./class-groups"
import {
  optionalIdFilter,
  paginationFields,
  requiredId,
  timestamps,
} from "./common"
import { schedules } from "./schedules"
import { spaces } from "./spaces"
import { subjects } from "./subjects"
import { users } from "./users"

export const DEFAULT_ASSIGNMENT_DURATION = 2

export const assignments = mysqlTable("assignments", {
  id: int("id").autoincrement().primaryKey(),
  teacher_id: int("teacher_id").references(() => users.id),
  subject_id: int("subject_id").references(() => subjects.id),
  space_id: int("space_id").references(() => spaces.id),
  class_group_id: int("class_group_id").references(() => classGroups.id),
  duration: int("duration").notNull().default(DEFAULT_ASSIGNMENT_DURATION),
  ...timestamps(),
})

/** Join table backing the assignment <-> schedule many-to-many relation. */
export const assignmentSchedules = mysqlTable("assignment_schedules", {
  id: int("id").autoincrement().primaryKey(),
  assignment_id: int("assignment_id")
    .notNull()
    .references(() => assignments.id),
  schedule_id: int("schedule_id")
    .notNull()
    .references(() => schedules.id),
  ...timestamps(),
})

export type Assignment = typeof assignments.$inferSelect
export type NewAssignment = typeof assignments.$inferInsert
export type AssignmentSchedule = typeof assignmentSchedules.$inferSelect
export type NewAssignmentSchedule = typeof assignmentSchedules.$inferInsert

const assignmentFields = {
  schedule_ids: z
    .array(requiredId("Horário inválido."))
    .min(1, { error: "Selecione ao menos um horário." })
    .optional(),
  teacher_id: requiredId("Selecione um professor."),
  subject_id: requiredId("Selecione uma disciplina."),
  space_id: requiredId("Selecione um espaço.").optional(),
  class_group_id: requiredId("Selecione uma turma."),
  duration: requiredId("A duração deve ser maior que zero.").optional(),
}

export const createAssignmentSchema = z.object(assignmentFields)
export const updateAssignmentSchema = z.object(assignmentFields).partial()

export const listAssignmentsQuerySchema = z.object({
  ...paginationFields,
  schedule_id: optionalIdFilter,
  teacher_id: optionalIdFilter,
  subject_id: optionalIdFilter,
  space_id: optionalIdFilter,
  class_group_id: optionalIdFilter,
})

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>
export type ListAssignmentsQuery = z.infer<typeof listAssignmentsQuerySchema>
