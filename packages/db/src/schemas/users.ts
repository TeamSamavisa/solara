import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { z } from "zod"

import {
  optionalTextFilter,
  paginationFields,
  requiredText,
  timestamps,
} from "./common"

export const USER_ROLES = [
  "admin",
  "principal",
  "coordinator",
  "teacher",
] as const

export type UserRole = (typeof USER_ROLES)[number]

/** Roles the legacy `GET /user/teachers` endpoint considered teaching staff. */
export const TEACHING_ROLES = ["teacher", "coordinator"] as const

export const DEFAULT_USER_ROLE: UserRole = "teacher"

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  full_name: varchar("full_name", { length: 255 }).notNull(),
  registration: varchar("registration", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 255 }).notNull(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  ...timestamps(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

/** The legacy default scope hid `password_hash` from every response. */
export type PublicUser = Omit<User, "password_hash">

const userFields = {
  full_name: requiredText("Informe o nome completo."),
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z
    .string({ error: "Informe a senha." })
    .min(6, { error: "A senha deve ter ao menos 6 caracteres." })
    .optional(),
  registration: z
    .string({ error: "Informe a matrícula." })
    .regex(/^\d+$/, { error: "A matrícula deve conter apenas números." })
    .optional(),
  role: z
    .enum(USER_ROLES, {
      error: "Selecione um cargo válido.",
    })
    .optional(),
}

export const createUserSchema = z.object(userFields)
export const updateUserSchema = z.object(userFields).partial()

export const listUsersQuerySchema = z.object({
  ...paginationFields,
  full_name: optionalTextFilter,
  email: optionalTextFilter,
  registration: optionalTextFilter,
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>

/**
 * Self-service profile editing.
 *
 * `role` is deliberately absent: zod strips unknown keys, so a crafted request
 * carrying `role=admin` cannot escalate the caller's own privileges. The user
 * id is never read from the form either — it comes from the session.
 */
export const updateProfileSchema = z
  .object({
    full_name: userFields.full_name,
    email: userFields.email,
    registration: userFields.registration,
    password: userFields.password,
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.password || data.password === data.confirmPassword,
    {
      error: "As senhas não coincidem.",
      path: ["confirmPassword"],
    },
  )

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
