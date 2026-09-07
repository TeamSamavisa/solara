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
