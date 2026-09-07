import { redirect } from "next/navigation"

import {
  getCurrentUser,
  getOptionalSession,
  requireRole,
  verifySession,
} from "@/lib/auth/dal"
import { getSession } from "@/lib/auth/session"
import { getUserById } from "@solara/db/actions/users"
import { NotFoundError } from "@solara/db/errors"

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))
jest.mock("@/lib/auth/session", () => ({ getSession: jest.fn() }))
jest.mock("@solara/db/actions/users", () => ({ getUserById: jest.fn() }))

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>
const mockRedirect = redirect as unknown as jest.Mock

const session = { userId: 7, role: "coordinator" as const }

const user = {
  id: 7,
  full_name: "Ana Souza",
  registration: "20240001",
  email: "ana@example.com",
  role: "coordinator",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
}

describe("verifySession", () => {
  it("returns the session when the cookie is valid", async () => {
    mockGetSession.mockResolvedValue(session)

    await expect(verifySession()).resolves.toEqual(session)
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("redirects to the login page when there is no session", async () => {
    mockGetSession.mockResolvedValue(null)

    await expect(verifySession()).rejects.toThrow("REDIRECT:/login")
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })
})

describe("getOptionalSession", () => {
  it("returns the session when present", async () => {
    mockGetSession.mockResolvedValue(session)

    await expect(getOptionalSession()).resolves.toEqual(session)
  })

  it("returns null instead of redirecting", async () => {
    mockGetSession.mockResolvedValue(null)

    await expect(getOptionalSession()).resolves.toBeNull()
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})

describe("getCurrentUser", () => {
  it("loads the user referenced by the session", async () => {
    mockGetSession.mockResolvedValue(session)
    mockGetUserById.mockResolvedValue(user)

    await expect(getCurrentUser()).resolves.toEqual(user)
    expect(mockGetUserById).toHaveBeenCalledWith(7)
  })

  it("returns null when the session points at a deleted user", async () => {
    mockGetSession.mockResolvedValue(session)
    mockGetUserById.mockRejectedValue(new NotFoundError("Usuário não encontrado."))

    await expect(getCurrentUser()).resolves.toBeNull()
  })

  it("redirects when there is no session at all", async () => {
    mockGetSession.mockResolvedValue(null)

    await expect(getCurrentUser()).rejects.toThrow("REDIRECT:/login")
    expect(mockGetUserById).not.toHaveBeenCalled()
  })
})

describe("requireRole", () => {
  it("allows the exact role", async () => {
    mockGetSession.mockResolvedValue(session)

    await expect(requireRole("coordinator")).resolves.toEqual(session)
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("allows a role above the requirement", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "admin" })

    await expect(requireRole("coordinator")).resolves.toMatchObject({
      role: "admin",
    })
  })

  it("blocks a role below the requirement", async () => {
    mockGetSession.mockResolvedValue({ userId: 2, role: "teacher" })

    await expect(requireRole("coordinator")).rejects.toThrow(
      "REDIRECT:/error/403",
    )
    expect(mockRedirect).toHaveBeenCalledWith("/error/403")
  })

  it("blocks an admin-only area for a principal", async () => {
    mockGetSession.mockResolvedValue({ userId: 3, role: "principal" })

    await expect(requireRole("admin")).rejects.toThrow("REDIRECT:/error/403")
  })

  it("redirects to login before checking the role when unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null)

    await expect(requireRole("admin")).rejects.toThrow("REDIRECT:/login")
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })
})
