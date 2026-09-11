import nodemailer from "nodemailer"

import { createMailTransporter } from "@/lib/mail/transporter"

jest.mock("nodemailer", () => ({ createTransport: jest.fn() }))

const mockCreateTransport = nodemailer.createTransport as jest.Mock

const originalEnv = process.env

beforeEach(() => {
  mockCreateTransport.mockReset()
  mockCreateTransport.mockReturnValue({ sendMail: jest.fn() })

  process.env = {
    ...originalEnv,
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "587",
    SMTP_USER: "solara",
    SMTP_PASSWORD: "s3cret",
  }
})

afterAll(() => {
  process.env = originalEnv
})

function transportOptions() {
  createMailTransporter()
  return mockCreateTransport.mock.calls[0][0]
}

describe("createMailTransporter", () => {
  it("defaults to the submission port without implicit TLS", () => {
    delete process.env.SMTP_PORT

    expect(transportOptions()).toMatchObject({ port: 587, secure: false })
  })

  it("enables TLS when SMTP_SECURE asks for it, even on a plain port", () => {
    process.env.SMTP_SECURE = "true"

    expect(transportOptions()).toMatchObject({ port: 587, secure: true })
  })

  it("enables TLS on the implicit-TLS port even without SMTP_SECURE", () => {
    process.env.SMTP_PORT = "465"
    delete process.env.SMTP_SECURE

    expect(transportOptions()).toMatchObject({ port: 465, secure: true })
  })

  it("treats any other value of SMTP_SECURE as off", () => {
    process.env.SMTP_SECURE = "yes"

    expect(transportOptions().secure).toBe(false)
  })

  it("rejects a non-numeric port instead of building a broken transporter", () => {
    process.env.SMTP_PORT = "abc"

    expect(() => createMailTransporter()).toThrow("SMTP_PORT")
    expect(mockCreateTransport).not.toHaveBeenCalled()
  })

  it("rejects an out-of-range port", () => {
    process.env.SMTP_PORT = "0"

    expect(() => createMailTransporter()).toThrow("SMTP_PORT")
  })

  it("requires the host", () => {
    delete process.env.SMTP_HOST

    expect(() => createMailTransporter()).toThrow("SMTP_HOST")
    expect(mockCreateTransport).not.toHaveBeenCalled()
  })
})
