import { z } from "zod"

/**
 * Shared definitions for the auth server actions. They live outside the
 * `"use server"` module because such a module may only export async functions.
 */

export const loginSchema = z.object({
  // Trimming has to happen before the format check: `z.email().trim()` would
  // validate the untrimmed value and reject "  ana@example.com  ".
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.email({ error: "Informe um e-mail válido." }),
  ),
  password: z.string().min(1, { error: "Informe sua senha." }),
})

export type LoginInput = z.infer<typeof loginSchema>

export interface LoginFormState {
  errors?: {
    email?: string[]
    password?: string[]
  }
  message?: string
  /** Echoed back so the field is not cleared when validation fails. */
  email?: string
}

export const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha inválidos."

/**
 * Account recovery. The same acknowledgement is returned whether or not the
 * e-mail is registered, so the form cannot be used to enumerate accounts.
 */
export const forgotPasswordSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.email({ error: "Informe um e-mail válido." }),
  ),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export interface ForgotPasswordFormState {
  errors?: {
    email?: string[]
  }
  message?: string
  success?: boolean
  /** Echoed back so the field is not cleared when validation fails. */
  email?: string
}

export const PASSWORD_RESET_REQUESTED_MESSAGE =
  "Se o e-mail informado estiver cadastrado, você receberá as instruções para recuperar a conta."

export const resetPasswordSchema = z
  .object({
    token: z
      .string({ error: "Token de recuperação inválido ou expirado." })
      .min(1, { error: "Token de recuperação inválido ou expirado." }),
    password: z
      .string()
      .min(6, { error: "A senha deve ter ao menos 6 caracteres." }),
    confirmPassword: z.string().min(1, { error: "Confirme a nova senha." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export interface ResetPasswordFormState {
  errors?: {
    password?: string[]
    confirmPassword?: string[]
  }
  message?: string
}

export const DEFAULT_REDIRECT = "/dashboard"

/**
 * Only same-origin, absolute-path redirects are allowed, so a crafted
 * `?redirectTo=` cannot bounce the user to another host after login.
 */
export function safeRedirectPath(
  value: unknown,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (typeof value !== "string" || value.length === 0) return fallback

  // Reject anything that is not a plain path, including protocol-relative
  // (`//evil.com`) and backslash variants that some browsers normalise.
  if (!value.startsWith("/")) return fallback
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback
  if (value.includes("://")) return fallback

  return value
}
