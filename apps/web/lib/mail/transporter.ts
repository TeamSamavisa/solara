import nodemailer, { type Transporter } from "nodemailer"

function requiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`A variável de ambiente ${name} não está configurada.`)
  }

  return value
}

/**
 * Builds an SMTP transporter from the environment. Transporters are cheap to
 * create — the connection only opens on `sendMail` — so reading the env on
 * every call keeps configuration changes (and tests) predictable.
 */
export function createMailTransporter(): Transporter {
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER

  return nodemailer.createTransport({
    host: requiredEnv("SMTP_HOST"),
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: user ? { user, pass: process.env.SMTP_PASSWORD ?? "" } : undefined,
  })
}
