import { datetime, int, mysqlEnum, mysqlTable, text, varchar } from "drizzle-orm/mysql-core"
import { z } from "zod"

export const TASK_STATUSES = ["PROCESSING", "COMPLETED", "FAILED"] as const
export const TASK_TYPES = ["TIMETABLE_OPTIMIZATION"] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]
export type TaskType = (typeof TASK_TYPES)[number]

/**
 * Unlike the other models, the legacy `Task` entity declared its timestamp
 * columns explicitly, so they are snake_case here.
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  correlation_id: varchar("correlation_id", { length: 255 })
    .notNull()
    .unique(),
  status: mysqlEnum("status", TASK_STATUSES).notNull().default("PROCESSING"),
  type: mysqlEnum("type", TASK_TYPES).notNull(),
  error_message: text("error_message"),
  progress: int("progress").default(0),
  created_at: datetime("created_at").notNull().defaultNow(),
  updated_at: datetime("updated_at").notNull().defaultNow().onUpdateNow(),
})

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert

export const createTaskSchema = z.object({
  correlation_id: z.string().min(1),
  type: z.enum(TASK_TYPES),
  status: z.enum(TASK_STATUSES).optional(),
})

export const updateTaskSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  error_message: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
