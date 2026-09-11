import nodemailer from "nodemailer"

import {
  sendFirstAccessEmail,
  sendFirstAccessInstructions,
} from "@/lib/mail/first-access"
import { createFirstAccessToken } from "@solara/db/actions/first-access-tokens"

jest.mock("nodemailer", () => ({ createTransport: jest.fn() }))
jest.mock("@solara/db/actions/first-access-tokens", () => ({
  ...jest.requireActual("@solara/db/actions/first-access-tokens"),
  createFirstAccessToken: jest.fn(),
}))

const mockCreateTransport = nodemailer.createTransport as jest.Mock
const mockCreateFirstAccessToken =
  createFirstAccessToken as jest.MockedFunction<typeof createFirstAccessToken>
const sendMail = jest.fn()

const originalEnv = process.env

beforeEach(() => {
  sendMail.mockReset()
  mockCreateTransport.mockReset()
  mockCreateTransport.mockReturnValue({ sendMail })
  mockCreateFirstAccessToken.mockReset()

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
  accessUrl: "http://localhost:3000/first-access?token=abc123",
}

describe("sendFirstAccessEmail", () => {
  it("configures the transporter from the environment", async () => {
    await sendFirstAccessEmail(message)

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "solara", pass: "s3cret" },
    })
  })

  it("sends the first access instructions to the user", async () => {
    await sendFirstAccessEmail(message)

    expect(sendMail).toHaveBeenCalledTimes(1)
    const sent = sendMail.mock.calls[0][0]
    expect(sent.from).toBe("Solara <no-reply@solara.example.com>")
    expect(sent.to).toBe("ana@example.com")
    expect(sent.subject).toContain("Primeiro acesso")
  })

  it("includes the rendered access link in the html body", async () => {
    await sendFirstAccessEmail(message)

    const sent = sendMail.mock.calls[0][0]
    expect(sent.html).toContain("Ana Souza")
    expect(sent.html).toContain(
      'href="http://localhost:3000/first-access?token=abc123"'
    )
  })

  it("includes a plain-text fallback with the same link", async () => {
    await sendFirstAccessEmail(message)

    const sent = sendMail.mock.calls[0][0]
    expect(sent.text).toContain(
      "http://localhost:3000/first-access?token=abc123"
    )
  })

  it("throws a clear error when SMTP is not configured", async () => {
    delete process.env.SMTP_HOST

    await expect(sendFirstAccessEmail(message)).rejects.toThrow("SMTP_HOST")
    expect(mockCreateTransport).not.toHaveBeenCalled()
  })
})

describe("sendFirstAccessInstructions", () => {
  const user = { id: 7, full_name: "Ana Souza", email: "ana@example.com" }

  beforeEach(() => {
    process.env.APP_URL = "https://solara.example.com"
    mockCreateFirstAccessToken.mockResolvedValue("plain-token")
  })

  afterEach(() => {
    delete process.env.APP_URL
  })

  it("issues a token and emails the first access link", async () => {
    await sendFirstAccessInstructions(user)

    expect(mockCreateFirstAccessToken).toHaveBeenCalledWith(7)

    const sent = sendMail.mock.calls[0][0]
    expect(sent.to).toBe("ana@example.com")
    expect(sent.html).toContain(
      'href="https://solara.example.com/first-access?token=plain-token"'
    )
  })

  it("falls back to localhost when APP_URL is not configured", async () => {
    delete process.env.APP_URL

    await sendFirstAccessInstructions(user)

    const sent = sendMail.mock.calls[0][0]
    expect(sent.text).toContain(
      "http://localhost:3000/first-access?token=plain-token"
    )
  })

  it("sends nothing when the token cannot be issued", async () => {
    mockCreateFirstAccessToken.mockRejectedValue(new Error("db down"))

    await expect(sendFirstAccessInstructions(user)).rejects.toThrow("db down")
    expect(sendMail).not.toHaveBeenCalled()
  })
})
