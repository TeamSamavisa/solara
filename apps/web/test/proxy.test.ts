import { NextRequest } from "next/server"

import { DEFAULT_REDIRECT } from "@/lib/auth/definitions"
import { decrypt, SESSION_COOKIE } from "@/lib/auth/session"
import proxy, { config } from "@/proxy"

// The proxy itself is exercised for real — only the session crypto (already
// covered in test/lib/auth/session.test.ts) is replaced.
jest.mock("@/lib/auth/session", () => ({
  ...jest.requireActual("@/lib/auth/session"),
  decrypt: jest.fn(),
}))

const mockDecrypt = decrypt as jest.MockedFunction<typeof decrypt>

function requestFor(path: string, withCookie = false) {
  const request = new NextRequest(`http://localhost:3000${path}`)
  if (withCookie) request.cookies.set(SESSION_COOKIE, "token-value")
  return request
}

beforeEach(() => {
  mockDecrypt.mockReset()
})

describe("proxy", () => {
  it("redirects an anonymous visitor of a protected route to the login page", async () => {
    mockDecrypt.mockResolvedValue(null)

    const response = await proxy(requestFor("/dashboard"))

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirectTo=%2Fdashboard",
    )
  })

  it("preserves the query string in the redirect target", async () => {
    mockDecrypt.mockResolvedValue(null)

    const response = await proxy(requestFor("/dashboard?tab=geral"))

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirectTo=%2Fdashboard%3Ftab%3Dgeral",
    )
  })

  it("treats an unreadable cookie as signed out, even when one is present", async () => {
    // Expired or forged token: decrypt returns null.
    mockDecrypt.mockResolvedValue(null)

    const response = await proxy(requestFor("/dashboard", true))

    expect(mockDecrypt).toHaveBeenCalledWith("token-value")
    expect(response.status).toBe(307)
  })

  it("lets a signed-in visitor through a protected route", async () => {
    mockDecrypt.mockResolvedValue({ userId: 1, role: "admin" })

    const response = await proxy(requestFor("/dashboard", true))

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
  })

  it("sends a signed-in visitor away from the login page", async () => {
    mockDecrypt.mockResolvedValue({ userId: 1, role: "admin" })

    const response = await proxy(requestFor("/login", true))

    expect(response.headers.get("location")).toBe(
      `http://localhost:3000${DEFAULT_REDIRECT}`,
    )
  })

  it("lets an anonymous visitor reach the login page", async () => {
    mockDecrypt.mockResolvedValue(null)

    const response = await proxy(requestFor("/login"))

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
  })
})

describe("proxy matcher", () => {
  const patterns = config.matcher.map((source) => new RegExp(`^${source}$`))
  const covered = (path: string) =>
    patterns.some((pattern) => pattern.test(path))

  it.each([
    "/api/health",
    "/_next/static/chunk.js",
    "/_next/image/photo",
    "/favicon.ico",
    "/logo.svg",
    "/photos/team.png",
  ])("skips %s", (path) => {
    expect(covered(path)).toBe(false)
  })

  it.each(["/", "/login", "/dashboard", "/dashboard/settings"])(
    "covers %s",
    (path) => {
      expect(covered(path)).toBe(true)
    },
  )
})
