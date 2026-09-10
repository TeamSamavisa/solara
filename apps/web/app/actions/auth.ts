"use server"

import { compare } from "bcryptjs"
import { redirect } from "next/navigation"

import {
  INVALID_CREDENTIALS_MESSAGE,
  PASSWORD_RESET_REQUESTED_MESSAGE,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  safeRedirectPath,
  type ForgotPasswordFormState,
  type LoginFormState,
  type ResetPasswordFormState,
} from "@/lib/auth/definitions"
import { isRole } from "@/lib/auth/roles"
import { createSession, deleteSession } from "@/lib/auth/session"
import { errorToFormState, toFieldErrors } from "@/lib/forms"
import { sendPasswordResetEmail } from "@/lib/mail/password-reset"
import {
  createPasswordResetToken,
  resetPasswordWithToken,
} from "@solara/db/actions/password-reset-tokens"
import { getUserByEmail } from "@solara/db/actions/users"

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

function appBaseUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000"
}

/**
 * Starts the account recovery flow.
 *
 * The acknowledgement is identical for registered and unregistered e-mails,
 * so the form cannot be used to enumerate accounts; only the registered path
 * issues a token and sends the recovery e-mail.
 */
export async function requestPasswordReset(
  _state: ForgotPasswordFormState | undefined,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const submittedEmail = formData.get("email")
  const validated = forgotPasswordSchema.safeParse({ email: submittedEmail })

  if (!validated.success) {
    return {
      errors: toFieldErrors<"email">(validated.error),
      email: typeof submittedEmail === "string" ? submittedEmail : undefined,
    }
  }

  const { email } = validated.data
  const user = await findUser(email)

  if (user) {
    try {
      const token = await createPasswordResetToken(user.id)

      await sendPasswordResetEmail({
        to: user.email,
        name: user.full_name,
        resetUrl: `${appBaseUrl()}/reset-password?token=${token}`,
      })
    } catch {
      return {
        message:
          "Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.",
        email,
      }
    }
  }

  return { success: true, message: PASSWORD_RESET_REQUESTED_MESSAGE }
}

/**
 * Completes the recovery flow from the token in the e-mail link.
 *
 * `redirect` throws to unwind the action, so it stays outside of try/catch.
 */
export async function resetPassword(
  _state: ResetPasswordFormState | undefined,
  formData: FormData,
): Promise<ResetPasswordFormState | undefined> {
  const validated = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!validated.success) {
    const errors = toFieldErrors<"token" | "password" | "confirmPassword">(
      validated.error,
    )

    // The token arrives in a hidden field, so there is no input to attach the
    // error to; it becomes a form-level message instead.
    if (errors.token) {
      return { message: errors.token[0] }
    }

    return { errors }
  }

  const { token, password } = validated.data

  try {
    await resetPasswordWithToken(token, password)
  } catch (error) {
    return errorToFormState(error, "Não foi possível redefinir a senha.")
  }

  redirect("/login")
}

async function findUser(email: string) {
  try {
    return await getUserByEmail(email)
  } catch {
    return null
  }
}

async function findCredentials(email: string) {
  try {
    return await getUserByEmail(email)
  } catch {
    return null
  }
}
