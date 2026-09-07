import { compare } from "bcryptjs"
import { redirect } from "next/navigation"

import { login, logout } from "@/app/actions/auth"
import { INVALID_CREDENTIALS_MESSAGE } from "@/lib/auth/definitions"
import { createSession, deleteSession } from "@/lib/auth/session"
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
const mockRedirect = redirect as unknown as jest.Mock

const credentials = {
  id: 7,
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
