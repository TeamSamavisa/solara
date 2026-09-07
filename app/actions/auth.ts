"use server"

import { compare } from "bcryptjs"
import { redirect } from "next/navigation"

import {
  INVALID_CREDENTIALS_MESSAGE,
  loginSchema,
  safeRedirectPath,
  type LoginFormState,
} from "@/lib/auth/definitions"
import { isRole } from "@/lib/auth/roles"
import { createSession, deleteSession } from "@/lib/auth/session"
import { getUserByEmail } from "@/lib/db/actions/users"
import { toFieldErrors } from "@/lib/forms"

/**
 * Comparison target used when the e-mail is unknown.
 *
 * Without it the action would return before hashing, and the response for an
 * unregistered e-mail would be visibly faster than for a registered one —
 * enough to enumerate accounts. Its cost factor must match the one used when
 * storing passwords, otherwise the timings still differ.
 *
 * Its plaintext is irrelevant to security: even if `compare` returned true,
 * the missing-credentials guard below rejects the attempt because there is no
 * user record to sign in as.
 */
const DUMMY_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8e6oCJ8gPYPzEZBpVUj9Xk1cV0m0Iu"

export async function login(
  _state: LoginFormState | undefined,
  formData: FormData,
): Promise<LoginFormState | undefined> {
  const submittedEmail = formData.get("email")
  const validated = loginSchema.safeParse({
    email: submittedEmail,
    password: formData.get("password"),
  })

  if (!validated.success) {
    return {
      errors: toFieldErrors<"email" | "password">(validated.error),
      email: typeof submittedEmail === "string" ? submittedEmail : undefined,
    }
  }

  const { email, password } = validated.data
  const credentials = await findCredentials(email)

  const passwordMatches = await compare(
    password,
    credentials?.password_hash ?? DUMMY_HASH,
  )

  // The same message for an unknown e-mail, a wrong password and a corrupted
  // role, so nothing about the account is leaked.
  if (!credentials || !passwordMatches || !isRole(credentials.role)) {
    return { message: INVALID_CREDENTIALS_MESSAGE, email }
  }

  await createSession(credentials.id, credentials.role)

  // `redirect` throws to unwind the action, so it stays outside of try/catch.
  redirect(safeRedirectPath(formData.get("redirectTo")))
}

export async function logout(): Promise<void> {
  await deleteSession()

  redirect("/login")
}

async function findCredentials(email: string) {
  try {
    return await getUserByEmail(email)
  } catch {
    return null
  }
}
