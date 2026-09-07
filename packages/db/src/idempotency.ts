import "server-only"

import { and, eq } from "drizzle-orm"

import { db } from "./client"
import { idempotencyKeys } from "./schemas"

/**
 * Runs `operation` at most once for a given key.
 *
 * The key is claimed with an insert on a primary-key column, so a concurrent or
 * replayed submission loses the race and is reported as already applied instead
 * of creating a duplicate record.
 */
export async function runOnce<T>(
  scope: string,
  key: string | undefined,
  operation: () => Promise<T>,
): Promise<{ applied: true; result: T } | { applied: false }> {
  // Without a key there is nothing to deduplicate against.
  if (!key) {
    return { applied: true, result: await operation() }
  }

  const claimed = await claimKey(scope, key)

  if (!claimed) {
    return { applied: false }
  }

  try {
    return { applied: true, result: await operation() }
  } catch (error) {
    // Release the key so the user can fix the input and submit again.
    await releaseKey(scope, key)
    throw error
  }
}

async function claimKey(scope: string, key: string): Promise<boolean> {
  try {
    await db.insert(idempotencyKeys).values({ key, scope })

    return true
  } catch {
    // Duplicate primary key: the mutation already ran.
    return false
  }
}

async function releaseKey(scope: string, key: string): Promise<void> {
  try {
    await db
      .delete(idempotencyKeys)
      .where(
        and(eq(idempotencyKeys.key, key), eq(idempotencyKeys.scope, scope)),
      )
  } catch {
    // Best effort: a stale key only costs one retry.
  }
}
