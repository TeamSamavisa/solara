import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"

import { getUserById } from "@solara/db/actions/users"
import type { PublicUser } from "@solara/db/schemas"

import { hasRole, type Role } from "./roles"
import { getSession, type SessionPayload } from "./session"

/**
 * Data Access Layer.
 *
 * Every server component, server action and route handler that touches
 * protected data should start here, so authorization lives next to the data
 * instead of relying on the proxy alone.
 */

/** Session without redirecting; use it for optional UI such as the nav. */
export const getOptionalSession = cache(
  async (): Promise<SessionPayload | null> => getSession(),
)

/** Session or bust: redirects unauthenticated visitors to the login page. */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return session
})

/** Requires the session to sit at or above `required` in the hierarchy. */
export async function requireRole(required: Role): Promise<SessionPayload> {
  const session = await verifySession()

  if (!hasRole(session.role, required)) {
    redirect("/error/403")
  }

  return session
}

/**
 * The signed-in user, or `null` when the cookie outlived the record (for
 * example the account was deleted while the session was still valid).
 */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const session = await verifySession()

  try {
    return await getUserById(session.userId)
  } catch {
    return null
  }
})
