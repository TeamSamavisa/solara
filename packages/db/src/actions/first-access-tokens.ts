import { hash } from "bcryptjs"
import { and, eq, isNull } from "drizzle-orm"
import { createHash, randomBytes } from "node:crypto"

import { db } from "../client"
import { NotFoundError } from "../errors"
import {
  activateAccountSchema,
  firstAccessTokens,
  INVALID_FIRST_ACCESS_TOKEN_MESSAGE,
  users,
} from "../schemas"
import { requireFound } from "./utils"

const PASSWORD_SALT_ROUNDS = 10
const TOKEN_BYTES = 32

/** First-access links stay valid for 24 hours. */
export const FIRST_ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/**
 * Issues a first-access token for the user and returns it in plaintext — the
 * only moment it is available, since only its hash is persisted.
 *
 * Any previous tokens of the user are removed first, so at most one link is
 * usable at a time (a resend kills the earlier links). The caller must have
 * already loaded the user, which guarantees it exists.
 */
export async function createFirstAccessToken(userId: number): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString("hex")

  await db.transaction(async (tx) => {
    await tx
      .delete(firstAccessTokens)
      .where(eq(firstAccessTokens.user_id, userId))

    await tx.insert(firstAccessTokens).values({
      user_id: userId,
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() + FIRST_ACCESS_TOKEN_TTL_MS),
    })
  })

  return token
}

/**
 * Activates a freshly created account: sets the first password chosen by the
 * user, which is what validates the account (until then the password is a
 * random value nobody knows).
 *
 * Unknown, used and expired tokens all raise the same NotFoundError, so the
 * response reveals nothing about which case was hit. On success the token is
 * consumed atomically with the password change, making every first-access
 * link single-use even under concurrent requests.
 */
export async function activateAccountWithToken(
  token: string,
  password: string
): Promise<void> {
  const data = activateAccountSchema.parse({ token, password })

  const [row] = await db
    .select()
    .from(firstAccessTokens)
    .where(eq(firstAccessTokens.token_hash, hashToken(data.token)))
    .limit(1)

  const record = requireFound(row, INVALID_FIRST_ACCESS_TOKEN_MESSAGE)

  if (record.used_at !== null || record.expires_at.getTime() <= Date.now()) {
    throw new NotFoundError(INVALID_FIRST_ACCESS_TOKEN_MESSAGE)
  }

  const passwordHash = await hash(data.password, PASSWORD_SALT_ROUNDS)

  await db.transaction(async (tx) => {
    // Consuming the token is conditional on it still being unused: a
    // concurrent request that consumed it first affects zero rows here,
    // closing the race between the check above and the update below.
    const [consumed] = await tx
      .update(firstAccessTokens)
      .set({ used_at: new Date() })
      .where(
        and(
          eq(firstAccessTokens.id, record.id),
          isNull(firstAccessTokens.used_at)
        )
      )

    if (consumed.affectedRows !== 1) {
      throw new NotFoundError(INVALID_FIRST_ACCESS_TOKEN_MESSAGE)
    }

    await tx
      .update(users)
      .set({ password_hash: passwordHash })
      .where(eq(users.id, record.user_id))
  })
}
