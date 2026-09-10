import { PASSWORD_RESET_TOKEN_TTL_MS } from "@solara/db/actions/password-reset-tokens"

import { renderEmailTemplate } from "./templates"
import { createMailTransporter } from "./transporter"

export interface PasswordResetMessage {
  to: string
  name: string
  /** Absolute URL the user clicks to choose a new password. */
  resetUrl: string
}

const DEFAULT_FROM = "Solara <no-reply@solara.local>"

/**
 * Sends the account recovery instructions. The link is the sensitive part of
 * the message, so the e-mail also states its validity window and that it can
 * be ignored when the user did not ask for it.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: PasswordResetMessage): Promise<void> {
  const expiresInMinutes = Math.round(PASSWORD_RESET_TOKEN_TTL_MS / 60_000)

  const html = renderEmailTemplate("password-reset", {
    name,
    resetUrl,
    expiresInMinutes,
  })

  const text = [
    `Olá, ${name}!`,
    "",
    "Recebemos um pedido para recuperar o acesso à sua conta Solara.",
    `Para escolher uma nova senha, acesse: ${resetUrl}`,
    `O link é válido por ${expiresInMinutes} minutos e só pode ser usado uma vez.`,
    "",
    "Se você não fez este pedido, ignore este e-mail: sua senha continua a mesma.",
  ].join("\n")

  await createMailTransporter().sendMail({
    from: process.env.MAIL_FROM ?? DEFAULT_FROM,
    to,
    subject: "Recuperação de senha — Solara",
    text,
    html,
  })
}
