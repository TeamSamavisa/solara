import { compare } from "bcryptjs"
import { redirect } from "next/navigation"

import {
  login,
  logout,
  requestPasswordReset,
  resetPassword,
} from "@/app/actions/auth"
import {
  INVALID_CREDENTIALS_MESSAGE,
  PASSWORD_RESET_REQUESTED_MESSAGE,
} from "@/lib/auth/definitions"
import { createSession, deleteSession } from "@/lib/auth/session"
import { sendPasswordResetEmail } from "@/lib/mail/password-reset"
import {
  createPasswordResetToken,
  resetPasswordWithToken,
} from "@solara/db/actions/password-reset-tokens"
import { getUserByEmail } from "@solara/db/actions/users"
import { NotFoundError } from "@solara/db/errors"

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))
jest.mock("bcryptjs", () => ({ compare: jest.fn() }))
jest.mock("@/lib/auth/session", () => ({
  createSession: jest.fn(),
  deleteSession: jest.fn(),
}))
jest.mock("@solara/db/actions/users", () => ({ getUserByEmail: jest.fn() }))
jest.mock("@solara/db/actions/password-reset-tokens", () => ({
  createPasswordResetToken: jest.fn(),
  resetPasswordWithToken: jest.fn(),
}))
jest.mock("@/lib/mail/password-reset", () => ({
  sendPasswordResetEmail: jest.fn(),
}))

const mockCompare = compare as jest.MockedFunction<typeof compare>
const mockCreateSession = createSession as jest.MockedFunction<
  typeof createSession
>
const mockDeleteSession = deleteSession as jest.MockedFunction<
  typeof deleteSession
>
const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<
  typeof getUserByEmail
>
const mockCreatePasswordResetToken =
  createPasswordResetToken as jest.MockedFunction<
    typeof createPasswordResetToken
  >
const mockResetPasswordWithToken =
  resetPasswordWithToken as jest.MockedFunction<typeof resetPasswordWithToken>
const mockSendPasswordResetEmail =
  sendPasswordResetEmail as jest.MockedFunction<typeof sendPasswordResetEmail>
const mockRedirect = redirect as unknown as jest.Mock

const credentials = {
  id: 7,
  full_name: "Ana Souza",
  email: "ana@example.com",
  role: "coordinator",
  password_hash: "$2b$10$hash",
}

function loginForm(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.append(key, value)
  return data
}

describe("login validation", () => {
  it("rejects a malformed email without querying the database", async () => {
    const state = await login(undefined,
      loginForm({ email: "nope", password: "secret123" }),
    )

    expect(state?.errors?.email).toEqual(["Informe um e-mail válido."])
    expect(mockGetUserByEmail).not.toHaveBeenCalled()
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it("rejects an empty password", async () => {
    const state = await login(undefined,
      loginForm({ email: "ana@example.com", password: "" }),
    )

    expect(state?.errors?.password).toEqual(["Informe sua senha."])
  })

  it("echoes the submitted email back so the field is not cleared", async () => {
    const state = await login(undefined,
      loginForm({ email: "typo@", password: "secret123" }),
    )

    expect(state?.email).toBe("typo@")
  })
})

describe("login credentials", () => {
  it("creates a session and redirects on success", async () => {
    mockGetUserByEmail.mockResolvedValue(credentials)
    mockCompare.mockResolvedValue(true as never)

    await expect(
      login(undefined, loginForm({ email: "ana@example.com", password: "secret123" })),
    ).rejects.toThrow("REDIRECT:/dashboard")

    expect(mockCompare).toHaveBeenCalledWith("secret123", "$2b$10$hash")
    expect(mockCreateSession).toHaveBeenCalledWith(7, "coordinator")
  })

  it("reports a generic message for an unknown email", async () => {
    mockGetUserByEmail.mockRejectedValue(new NotFoundError("Usuário não encontrado."))
    mockCompare.mockResolvedValue(false as never)

    const state = await login(undefined,
      loginForm({ email: "ghost@example.com", password: "secret123" }),
    )

    expect(state?.message).toBe(INVALID_CREDENTIALS_MESSAGE)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it("still hashes when the email is unknown, to avoid user enumeration", async () => {
    mockGetUserByEmail.mockRejectedValue(new NotFoundError("Usuário não encontrado."))
    mockCompare.mockResolvedValue(false as never)

    await login(undefined,
      loginForm({ email: "ghost@example.com", password: "secret123" }),
    )

    expect(mockCompare).toHaveBeenCalledTimes(1)
  })

  it("never signs in an unknown email, even if the dummy hash matched", async () => {
    // Worst case: someone learns the plaintext behind DUMMY_HASH and submits
    // it. bcrypt then reports a match, but there is no user record to sign in
    // as, so the missing-credentials guard must still reject the attempt.
    mockGetUserByEmail.mockRejectedValue(new NotFoundError("Usuário não encontrado."))
    mockCompare.mockResolvedValue(true as never)

    const state = await login(undefined,
      loginForm({ email: "ghost@example.com", password: "whatever-dummy-hashes-to" }),
    )

    expect(state?.message).toBe(INVALID_CREDENTIALS_MESSAGE)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it("reports the same message for a wrong password", async () => {
    mockGetUserByEmail.mockResolvedValue(credentials)
    mockCompare.mockResolvedValue(false as never)

    const state = await login(undefined,
      loginForm({ email: "ana@example.com", password: "wrong-password" }),
    )

    expect(state?.message).toBe(INVALID_CREDENTIALS_MESSAGE)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it("refuses to sign in a user whose stored role is not recognised", async () => {
    mockGetUserByEmail.mockResolvedValue({ ...credentials, role: "root" })
    mockCompare.mockResolvedValue(true as never)

    const state = await login(undefined,
      loginForm({ email: "ana@example.com", password: "secret123" }),
    )

    expect(state?.message).toBe(INVALID_CREDENTIALS_MESSAGE)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })
})

describe("login redirect target", () => {
  beforeEach(() => {
    mockGetUserByEmail.mockResolvedValue(credentials)
    mockCompare.mockResolvedValue(true as never)
  })

  it("honours a same-origin redirectTo", async () => {
    await expect(
      login(undefined,
        loginForm({
          email: "ana@example.com",
          password: "secret123",
          redirectTo: "/teachers?page=2",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/teachers?page=2")
  })

  it("ignores an off-site redirectTo", async () => {
    await expect(
      login(undefined,
        loginForm({
          email: "ana@example.com",
          password: "secret123",
          redirectTo: "https://evil.com",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard")
  })
})

describe("requestPasswordReset validation", () => {
  it("rejects a malformed email without querying the database", async () => {
    const state = await requestPasswordReset(
      undefined,
      loginForm({ email: "nope" }),
    )

    expect(state?.errors?.email).toEqual(["Informe um e-mail válido."])
    expect(mockGetUserByEmail).not.toHaveBeenCalled()
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it("echoes the submitted email back so the field is not cleared", async () => {
    const state = await requestPasswordReset(
      undefined,
      loginForm({ email: "typo@" }),
    )

    expect(state?.email).toBe("typo@")
  })
})

describe("requestPasswordReset", () => {
  beforeEach(() => {
    process.env.APP_URL = "https://solara.example.com"
  })

  afterEach(() => {
    delete process.env.APP_URL
  })

  it("answers an unknown email with the generic message and sends nothing", async () => {
    mockGetUserByEmail.mockRejectedValue(
      new NotFoundError("Usuário não encontrado."),
    )

    const state = await requestPasswordReset(
      undefined,
      loginForm({ email: "ghost@example.com" }),
    )

    expect(state).toEqual({
      success: true,
      message: PASSWORD_RESET_REQUESTED_MESSAGE,
    })
    expect(mockCreatePasswordResetToken).not.toHaveBeenCalled()
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it("issues a token and emails the reset link when the account exists", async () => {
    mockGetUserByEmail.mockResolvedValue(credentials)
    mockCreatePasswordResetToken.mockResolvedValue("plain-token")

    const state = await requestPasswordReset(
      undefined,
      loginForm({ email: "ana@example.com" }),
    )

    expect(mockCreatePasswordResetToken).toHaveBeenCalledWith(7)
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith({
      to: "ana@example.com",
      name: "Ana Souza",
      resetUrl: "https://solara.example.com/reset-password?token=plain-token",
    })
    expect(state).toEqual({
      success: true,
      message: PASSWORD_RESET_REQUESTED_MESSAGE,
    })
  })

  it("shows the same message for known and unknown emails", async () => {
    mockGetUserByEmail.mockResolvedValue(credentials)
    mockCreatePasswordResetToken.mockResolvedValue("plain-token")
    const known = await requestPasswordReset(
      undefined,
      loginForm({ email: "ana@example.com" }),
    )

    mockGetUserByEmail.mockRejectedValue(
      new NotFoundError("Usuário não encontrado."),
    )
    const unknown = await requestPasswordReset(
      undefined,
      loginForm({ email: "ghost@example.com" }),
    )

    expect(known?.message).toBe(unknown?.message)
  })

  it("falls back to localhost when APP_URL is not configured", async () => {
    delete process.env.APP_URL
    mockGetUserByEmail.mockResolvedValue(credentials)
    mockCreatePasswordResetToken.mockResolvedValue("plain-token")

    await requestPasswordReset(
      undefined,
      loginForm({ email: "ana@example.com" }),
    )

    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        resetUrl: "http://localhost:3000/reset-password?token=plain-token",
      }),
    )
  })

  it("reports a failure instead of pretending the email was sent", async () => {
    mockGetUserByEmail.mockResolvedValue(credentials)
    mockCreatePasswordResetToken.mockResolvedValue("plain-token")
    mockSendPasswordResetEmail.mockRejectedValue(new Error("SMTP down"))

    const state = await requestPasswordReset(
      undefined,
      loginForm({ email: "ana@example.com" }),
    )

    expect(state?.success).toBeUndefined()
    expect(state?.message).toBe(
      "Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.",
    )
  })
})

describe("resetPassword validation", () => {
  it("rejects mismatched passwords without touching the database", async () => {
    const state = await resetPassword(
      undefined,
      loginForm({
        token: "plain-token",
        password: "secret123",
        confirmPassword: "different",
      }),
    )

    expect(state?.errors?.confirmPassword).toEqual([
      "As senhas não coincidem.",
    ])
    expect(mockResetPasswordWithToken).not.toHaveBeenCalled()
  })

  it("rejects a short password", async () => {
    const state = await resetPassword(
      undefined,
      loginForm({
        token: "plain-token",
        password: "123",
        confirmPassword: "123",
      }),
    )

    expect(state?.errors?.password).toEqual([
      "A senha deve ter ao menos 6 caracteres.",
    ])
    expect(mockResetPasswordWithToken).not.toHaveBeenCalled()
  })

  it("reports a missing token as a form-level error", async () => {
    const state = await resetPassword(
      undefined,
      loginForm({ password: "secret123", confirmPassword: "secret123" }),
    )

    expect(state?.message).toBe("Token de recuperação inválido ou expirado.")
    expect(state?.errors).toBeUndefined()
    expect(mockResetPasswordWithToken).not.toHaveBeenCalled()
  })
})

describe("resetPassword", () => {
  it("resets the password and redirects to the login page", async () => {
    mockResetPasswordWithToken.mockResolvedValue(undefined)

    await expect(
      resetPassword(
        undefined,
        loginForm({
          token: "plain-token",
          password: "secret123",
          confirmPassword: "secret123",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/login")

    expect(mockResetPasswordWithToken).toHaveBeenCalledWith(
      "plain-token",
      "secret123",
    )
  })

  it("shows the token error raised by the database", async () => {
    mockResetPasswordWithToken.mockRejectedValue(
      new NotFoundError("Token de recuperação inválido ou expirado."),
    )

    const state = await resetPassword(
      undefined,
      loginForm({
        token: "stale-token",
        password: "secret123",
        confirmPassword: "secret123",
      }),
    )

    expect(state?.message).toBe("Token de recuperação inválido ou expirado.")
  })

  it("hides unexpected failures behind a generic message", async () => {
    mockResetPasswordWithToken.mockRejectedValue(new Error("db down"))

    const state = await resetPassword(
      undefined,
      loginForm({
        token: "plain-token",
        password: "secret123",
        confirmPassword: "secret123",
      }),
    )

    expect(state?.message).toBe("Não foi possível redefinir a senha.")
  })
})

describe("logout", () => {
  it("clears the session and returns to the login page", async () => {
    await expect(logout()).rejects.toThrow("REDIRECT:/login")

    expect(mockDeleteSession).toHaveBeenCalledTimes(1)
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })

  it("is idempotent: clearing an already empty session still redirects", async () => {
    await expect(logout()).rejects.toThrow("REDIRECT:/login")
    await expect(logout()).rejects.toThrow("REDIRECT:/login")

    expect(mockDeleteSession).toHaveBeenCalledTimes(2)
  })
})
