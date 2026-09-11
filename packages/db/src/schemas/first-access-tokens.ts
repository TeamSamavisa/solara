import { datetime, int, mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { z } from "zod"

import { timestamps } from "./common"
import { users } from "./users"

/**
 * First-access tokens, issued when an administrator creates an account.
 *
 * They live apart from `password_reset_tokens` so the two flows never share
 * links: a recovery link cannot activate a fresh account, and a first-access
 * link cannot be used to reset the password of an active one.
 *
 * Only the SHA-256 hash of the token is stored, so a database leak does not
 * hand out usable links. A token is single-use (`used_at`) and expires
 * shortly after being issued (`expires_at`).
 */
export const firstAccessTokens = mysqlTable("first_access_tokens", {
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

export type FirstAccessToken = typeof firstAccessTokens.$inferSelect
export type NewFirstAccessToken = typeof firstAccessTokens.$inferInsert

export const INVALID_FIRST_ACCESS_TOKEN_MESSAGE =
  "Token de primeiro acesso inválido ou expirado."

export const activateAccountSchema = z.object({
  token: z.string({ error: INVALID_FIRST_ACCESS_TOKEN_MESSAGE }).min(1, {
    error: INVALID_FIRST_ACCESS_TOKEN_MESSAGE,
  }),
  password: z
    .string({ error: "Informe a senha." })
    .min(6, { error: "A senha deve ter ao menos 6 caracteres." }),
})

export type ActivateAccountInput = z.infer<typeof activateAccountSchema>
