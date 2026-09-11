import { generateKeyPair, SignJWT, UnsecuredJWT } from "jose"
import { cookies } from "next/headers"

import {
  createSession,
  decrypt,
  deleteSession,
  encrypt,
  getSession,
  SESSION_COOKIE,
  SESSION_DURATION_MS,
} from "@/lib/auth/session"

jest.mock("next/headers", () => ({ cookies: jest.fn() }))

const mockCookies = cookies as jest.MockedFunction<typeof cookies>

function cookieStore() {
  return { get: jest.fn(), set: jest.fn(), delete: jest.fn() }
}

const ORIGINAL_ENV = process.env

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, SESSION_SECRET: "test-secret-value" }
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe("encrypt / decrypt", () => {
  it("round-trips the session payload", async () => {
    const token = await encrypt({ userId: 7, role: "coordinator" })
    const payload = await decrypt(token)

    expect(payload).toMatchObject({ userId: 7, role: "coordinator" })
  })

  it("carries only the session claims, readable by anyone holding the token", async () => {
    const token = await encrypt({ userId: 7, role: "admin" })

    // A JWT is signed, not encrypted: the payload is base64url for all to
    // read, so it must never grow claims beyond what the session needs.
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    )

    expect(Object.keys(payload).sort()).toEqual([
      "exp",
      "iat",
      "role",
      "userId",
    ])
  })

  it("returns null for an undefined or empty session", async () => {
    await expect(decrypt(undefined)).resolves.toBeNull()
    await expect(decrypt("")).resolves.toBeNull()
  })

  it("returns null for a malformed token", async () => {
    await expect(decrypt("not-a-jwt")).resolves.toBeNull()
  })

  it("rejects an unsigned token (alg: none)", async () => {
    const unsigned = new UnsecuredJWT({ userId: 1, role: "admin" }).encode()

    await expect(decrypt(unsigned)).resolves.toBeNull()
  })

  it("rejects a token from a different algorithm family (RS256)", async () => {
    // Classic algorithm-confusion: even a validly signed RS256 token must
    // not be accepted by a verifier that only allows HS256.
    const { privateKey } = await generateKeyPair("RS256")
    const confused = await new SignJWT({ userId: 1, role: "admin" })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(privateKey)

    await expect(decrypt(confused)).resolves.toBeNull()
  })

  it("signs the token for exactly the seven days the cookie lasts", async () => {
    const token = await encrypt({ userId: 7, role: "admin" })
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    )

    expect(payload.exp - payload.iat).toBe(SESSION_DURATION_MS / 1000)
  })

  it("rejects a token signed with a different secret", async () => {
    const forged = await new SignJWT({ userId: 1, role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode("another-secret"))

    await expect(decrypt(forged)).resolves.toBeNull()
  })

  it("rejects an expired token", async () => {
    const expired = await new SignJWT({ userId: 1, role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode("test-secret-value"))

    await expect(decrypt(expired)).resolves.toBeNull()
  })

  it("rejects a token whose payload lost its shape", async () => {
    const weird = await new SignJWT({ userId: "seven", role: "wizard" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode("test-secret-value"))

    await expect(decrypt(weird)).resolves.toBeNull()
  })

  it("fails loudly when SESSION_SECRET is missing", async () => {
    delete process.env.SESSION_SECRET

    await expect(encrypt({ userId: 1, role: "admin" })).rejects.toThrow(
      /SESSION_SECRET/,
    )
  })
})

describe("createSession", () => {
  it("stores a hardened http-only cookie", async () => {
    const store = cookieStore()
    mockCookies.mockResolvedValue(store as never)

    await createSession(7, "teacher")

    expect(store.set).toHaveBeenCalledTimes(1)
    const [name, value, options] = store.set.mock.calls[0]

    expect(name).toBe(SESSION_COOKIE)
    expect(await decrypt(value)).toMatchObject({ userId: 7, role: "teacher" })
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
    expect(options.expires).toBeInstanceOf(Date)
    // The cookie must live for the whole session window — not a minute, not
    // a day — or users would be logged out early (or far too late).
    const expected = Date.now() + SESSION_DURATION_MS
    expect(options.expires.getTime()).toBeGreaterThan(expected - 5000)
    expect(options.expires.getTime()).toBeLessThanOrEqual(expected)
  })

  it("does not require https outside production, so local dev works", async () => {
    const store = cookieStore()
    mockCookies.mockResolvedValue(store as never)

    await createSession(1, "admin")

    expect(store.set.mock.calls[0][2].secure).toBe(false)
  })

  it("requires https in production", async () => {
    const store = cookieStore()
    mockCookies.mockResolvedValue(store as never)
    process.env = { ...process.env, NODE_ENV: "production" }

    await createSession(1, "admin")

    expect(store.set.mock.calls[0][2].secure).toBe(true)
  })
})

describe("getSession", () => {
  it("returns the decoded payload when the cookie is valid", async () => {
    const token = await encrypt({ userId: 3, role: "principal" })
    const store = cookieStore()
    store.get.mockReturnValue({ value: token })
    mockCookies.mockResolvedValue(store as never)

    await expect(getSession()).resolves.toMatchObject({
      userId: 3,
      role: "principal",
    })
    expect(store.get).toHaveBeenCalledWith(SESSION_COOKIE)
  })

  it("returns null when there is no cookie", async () => {
    const store = cookieStore()
    store.get.mockReturnValue(undefined)
    mockCookies.mockResolvedValue(store as never)

    await expect(getSession()).resolves.toBeNull()
  })

  it("returns null when the cookie holds a forged token", async () => {
    const store = cookieStore()
    store.get.mockReturnValue({ value: "tampered.token.value" })
    mockCookies.mockResolvedValue(store as never)

    await expect(getSession()).resolves.toBeNull()
  })
})

describe("deleteSession", () => {
  it("removes the cookie", async () => {
    const store = cookieStore()
    mockCookies.mockResolvedValue(store as never)

    await deleteSession()

    expect(store.delete).toHaveBeenCalledWith(SESSION_COOKIE)
  })
})
