import "server-only"

import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

import { isRole, type Role } from "./roles"

export const SESSION_COOKIE = "session"

/** Matches the legacy refresh window: a week of inactivity ends the session. */
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export interface SessionPayload {
  userId: number
  role: Role
}

/**
 * Read lazily so the module can be imported without the variable being set
 * (during tests or a build), failing only when a session is actually used.
 */
function encodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET

  if (!secret) {
    throw new Error("SESSION_SECRET must be set to sign the session cookie")
  }

  return new TextEncoder().encode(secret)
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey())
}

/** Returns `null` for anything that is missing, forged, expired or malformed. */
export async function decrypt(
  session?: string,
): Promise<SessionPayload | null> {
  if (!session) return null

  try {
    const { payload } = await jwtVerify(session, encodedKey(), {
      algorithms: ["HS256"],
    })

    if (typeof payload.userId !== "number" || !isRole(payload.role)) {
      return null
    }

    return { userId: payload.userId, role: payload.role }
  } catch {
    return null
  }
}

export async function createSession(
  userId: number,
  role: Role,
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const session = await encrypt({ userId, role })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    // Requiring https locally would silently drop the cookie over http.
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()

  return decrypt(cookieStore.get(SESSION_COOKIE)?.value)
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.delete(SESSION_COOKIE)
}
