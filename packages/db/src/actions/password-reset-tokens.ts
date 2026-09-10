import { hash } from "bcryptjs"
import { eq } from "drizzle-orm"
import { createHash, randomBytes } from "node:crypto"

import { db } from "../client"
import { NotFoundError } from "../errors"
import {
  INVALID_RESET_TOKEN_MESSAGE,
  passwordResetTokens,
  resetPasswordWithTokenSchema,
  users,
} from "../schemas"
import { requireFound } from "./utils"

const PASSWORD_SALT_ROUNDS = 10
const TOKEN_BYTES = 32

/** Reset links stay valid for one hour. */
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/**
 * Issues a password recovery token for the user and returns it in plaintext —
 * the only moment it is available, since only its hash is persisted.
 *
 * Any previous tokens of the user are removed first, so at most one reset
 * link is usable at a time (requesting a new one kills the earlier links).
 * The caller must have already loaded the user, which guarantees it exists.
 */
export async function createPasswordResetToken(
  userId: number
): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString("hex")

  await db.transaction(async (tx) => {
    await tx
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.user_id, userId))

    await tx.insert(passwordResetTokens).values({
      user_id: userId,
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
    })
  })

  return token
}

/**
 * Resets the password of the user a valid recovery token belongs to.
 *
 * Unknown, used and expired tokens all raise the same NotFoundError, so the
 * response reveals nothing about which case was hit. On success the token is
 * consumed in the same transaction that changes the password, making every
 * reset link single-use.
 */
export async function resetPasswordWithToken(
  token: string,
  password: string
): Promise<void> {
  const data = resetPasswordWithTokenSchema.parse({ token, password })

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token_hash, hashToken(data.token)))
    .limit(1)

  const record = requireFound(row, INVALID_RESET_TOKEN_MESSAGE)

  if (record.used_at !== null || record.expires_at.getTime() <= Date.now()) {
    throw new NotFoundError(INVALID_RESET_TOKEN_MESSAGE)
  }

  const passwordHash = await hash(data.password, PASSWORD_SALT_ROUNDS)

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ password_hash: passwordHash })
      .where(eq(users.id, record.user_id))

    await tx
      .update(passwordResetTokens)
      .set({ used_at: new Date() })
      .where(eq(passwordResetTokens.id, record.id))
  })
}
