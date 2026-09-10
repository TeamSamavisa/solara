import { datetime, int, mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { z } from "zod"

import { timestamps } from "./common"
import { users } from "./users"

/**
 * Password recovery tokens.
 *
 * Only the SHA-256 hash of the token is stored, so a database leak does not
 * hand out usable reset links. A token is single-use (`used_at`) and expires
 * shortly after being issued (`expires_at`).
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  user_id: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** SHA-256 hex digest of the token, never the token itself. */
  token_hash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expires_at: datetime("expires_at").notNull(),
  used_at: datetime("used_at"),
  ...timestamps(),
})

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert

export const INVALID_RESET_TOKEN_MESSAGE =
  "Token de recuperação inválido ou expirado."

export const resetPasswordWithTokenSchema = z.object({
  token: z.string({ error: INVALID_RESET_TOKEN_MESSAGE }).min(1, {
    error: INVALID_RESET_TOKEN_MESSAGE,
  }),
  password: z
    .string({ error: "Informe a senha." })
    .min(6, { error: "A senha deve ter ao menos 6 caracteres." }),
})

export type ResetPasswordWithTokenInput = z.infer<
  typeof resetPasswordWithTokenSchema
>
