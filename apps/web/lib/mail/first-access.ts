import {
  createFirstAccessToken,
  FIRST_ACCESS_TOKEN_TTL_MS,
} from "@solara/db/actions/first-access-tokens"
import type { PublicUser } from "@solara/db/schemas"

import { renderEmailTemplate } from "./templates"
import { createMailTransporter } from "./transporter"

export interface FirstAccessMessage {
  to: string
  name: string
  /** Absolute URL the user clicks to set a password and validate the account. */
  accessUrl: string
}

const DEFAULT_FROM = "Solara <no-reply@solara.local>"

/**
 * Sends the first access instructions. The link defines the first password —
 * the sensitive part of the message — so the e-mail also states its validity
 * window and that it can be ignored when the user did not expect the account.
 */
export async function sendFirstAccessEmail({
  to,
  name,
  accessUrl,
}: FirstAccessMessage): Promise<void> {
  const expiresInHours = Math.round(FIRST_ACCESS_TOKEN_TTL_MS / 3_600_000)

  const html = renderEmailTemplate("first-access", {
    name,
    accessUrl,
    expiresInHours,
  })

  const text = [
    `Olá, ${name}!`,
    "",
    "Uma conta Solara foi criada para você.",
    `Para validar sua conta e definir sua senha, acesse: ${accessUrl}`,
    `O link é válido por ${expiresInHours} horas e só pode ser usado uma vez.`,
    "",
    "Se você não esperava este cadastro, ignore este e-mail.",
  ].join("\n")

  await createMailTransporter().sendMail({
    from: process.env.MAIL_FROM ?? DEFAULT_FROM,
    to,
    subject: "Primeiro acesso — Solara",
    text,
    html,
  })
}

function appBaseUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000"
}

/**
 * Issues the first-access token and e-mails the instructions to a user an
 * administrator just created.
 *
 * The link lands on the first-access page: choosing the first password is
 * what validates the account, since the initial one is random and unknown to
 * everyone — including the administrator.
 */
export async function sendFirstAccessInstructions(
  user: Pick<PublicUser, "id" | "email" | "full_name">
): Promise<void> {
  const token = await createFirstAccessToken(user.id)

  await sendFirstAccessEmail({
    to: user.email,
    name: user.full_name,
    accessUrl: `${appBaseUrl()}/first-access?token=${token}`,
  })
}
