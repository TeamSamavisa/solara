import nodemailer from "nodemailer"

import { sendPasswordResetEmail } from "@/lib/mail/password-reset"

jest.mock("nodemailer", () => ({ createTransport: jest.fn() }))

const mockCreateTransport = nodemailer.createTransport as jest.Mock
const sendMail = jest.fn()

const originalEnv = process.env

beforeEach(() => {
  sendMail.mockReset()
  mockCreateTransport.mockReset()
  mockCreateTransport.mockReturnValue({ sendMail })

  process.env = {
    ...originalEnv,
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "587",
    SMTP_USER: "solara",
    SMTP_PASSWORD: "s3cret",
    MAIL_FROM: "Solara <no-reply@solara.example.com>",
  }
})

afterAll(() => {
  process.env = originalEnv
})

const message = {
  to: "ana@example.com",
  name: "Ana Souza",
  resetUrl: "http://localhost:3000/reset-password?token=abc123",
}

describe("sendPasswordResetEmail", () => {
  it("configures the transporter from the environment", async () => {
    await sendPasswordResetEmail(message)

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "solara", pass: "s3cret" },
    })
  })

  it("omits the auth block when no user is configured", async () => {
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASSWORD

    await sendPasswordResetEmail(message)

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ auth: undefined })
    )
  })

  it("sends the recovery instructions to the user", async () => {
    await sendPasswordResetEmail(message)

    expect(sendMail).toHaveBeenCalledTimes(1)
    const sent = sendMail.mock.calls[0][0]
    expect(sent.from).toBe("Solara <no-reply@solara.example.com>")
    expect(sent.to).toBe("ana@example.com")
    expect(sent.subject).toContain("Recupera")
  })

  it("includes the rendered reset link in the html body", async () => {
    await sendPasswordResetEmail(message)

    const sent = sendMail.mock.calls[0][0]
    expect(sent.html).toContain("Ana Souza")
    expect(sent.html).toContain(
      'href="http://localhost:3000/reset-password?token=abc123"'
    )
  })

  it("includes a plain-text fallback with the same link", async () => {
    await sendPasswordResetEmail(message)

    const sent = sendMail.mock.calls[0][0]
    expect(sent.text).toContain(
      "http://localhost:3000/reset-password?token=abc123"
    )
  })

  it("throws a clear error when SMTP is not configured", async () => {
    delete process.env.SMTP_HOST

    await expect(sendPasswordResetEmail(message)).rejects.toThrow("SMTP_HOST")
    expect(mockCreateTransport).not.toHaveBeenCalled()
  })
})
