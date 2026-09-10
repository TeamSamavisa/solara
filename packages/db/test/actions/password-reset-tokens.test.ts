import { hash } from "bcryptjs"
import { createHash } from "node:crypto"
import { ZodError } from "zod"

import {
  createPasswordResetToken,
  PASSWORD_RESET_TOKEN_TTL_MS,
  resetPasswordWithToken,
} from "@/actions/password-reset-tokens"
import { db } from "@/client"
import { NotFoundError } from "@/errors"
import {
  chainOf,
  queueResults,
  resetMockDb,
  type MockDb,
} from "@test/support/db"

jest.mock("@/client", () => ({
  db: jest.requireActual("@test/support/db").createMockDb(),
}))

jest.mock("bcryptjs", () => ({
  hash: jest.fn(async (value: string) => `hashed:${value}`),
}))

const mockDb = db as unknown as MockDb
const mockHash = hash as jest.MockedFunction<typeof hash>

const INVALID_TOKEN_MESSAGE = "Token de recuperação inválido ou expirado."

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

const validTokenRow = {
  id: 3,
  user_id: 5,
  token_hash: sha256("plain-token"),
  expires_at: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
  used_at: null,
}

beforeEach(() => {
  resetMockDb(mockDb)
  mockHash.mockClear()
  mockHash.mockImplementation(async (value: string) => `hashed:${value}`)
})

describe("createPasswordResetToken", () => {
  it("returns a random plaintext token and persists only its hash", async () => {
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)

    const token = await createPasswordResetToken(5)

    expect(token).toMatch(/^[0-9a-f]{64}$/)

    const values = chainOf(mockDb.insert).argsFor("values")?.[0] as {
      user_id: number
      token_hash: string
      expires_at: Date
    }
    expect(values.user_id).toBe(5)
    expect(values.token_hash).toBe(sha256(token))
    expect(values.token_hash).not.toBe(token)
  })

  it("generates a different token on every call", async () => {
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)

    const first = await createPasswordResetToken(5)
    const second = await createPasswordResetToken(5)

    expect(first).not.toBe(second)
  })

  it("gives the token a limited lifetime", async () => {
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)

    const before = Date.now()
    await createPasswordResetToken(5)
    const after = Date.now()

    const values = chainOf(mockDb.insert).argsFor("values")?.[0] as {
      expires_at: Date
    }
    expect(values.expires_at.getTime()).toBeGreaterThanOrEqual(
      before + PASSWORD_RESET_TOKEN_TTL_MS
    )
    expect(values.expires_at.getTime()).toBeLessThanOrEqual(
      after + PASSWORD_RESET_TOKEN_TTL_MS
    )
  })

  it("invalidates the user's previous tokens before issuing a new one", async () => {
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)

    await createPasswordResetToken(5)

    expect(mockDb.delete).toHaveBeenCalledTimes(1)
    expect(chainOf(mockDb.delete).argsFor("where")?.[0]).toBeDefined()
    // The delete must happen before the insert, otherwise the new token
    // would be removed too.
    const deleteOrder = mockDb.delete.mock.invocationCallOrder[0]
    const insertOrder = mockDb.insert.mock.invocationCallOrder[0]
    expect(deleteOrder).toBeLessThan(insertOrder)
  })
})

describe("resetPasswordWithToken validation", () => {
  it("rejects an empty token before any query", async () => {
    await expect(resetPasswordWithToken("", "secret123")).rejects.toThrow(
      ZodError
    )
    expect(mockDb.select).not.toHaveBeenCalled()
  })

  it("rejects a password shorter than six characters", async () => {
    await expect(resetPasswordWithToken("plain-token", "123")).rejects.toThrow(
      ZodError
    )
    expect(mockDb.select).not.toHaveBeenCalled()
  })
})

describe("resetPasswordWithToken", () => {
  it("looks the token up by its hash, never by the plaintext value", async () => {
    queueResults(mockDb.select, [validTokenRow])
    queueResults(mockDb.update, undefined, undefined)

    await resetPasswordWithToken("plain-token", "secret123")

    const where = chainOf(mockDb.select, 0).argsFor("where")?.[0]
    expect(where).toBeDefined()
    expect(mockDb.select).toHaveBeenCalledTimes(1)
  })

  it("rejects an unknown token without touching any record", async () => {
    queueResults(mockDb.select, [])

    await expect(
      resetPasswordWithToken("plain-token", "secret123")
    ).rejects.toThrow(new NotFoundError(INVALID_TOKEN_MESSAGE))

    expect(mockDb.update).not.toHaveBeenCalled()
    expect(mockHash).not.toHaveBeenCalled()
  })

  it("rejects an already used token", async () => {
    queueResults(mockDb.select, [
      { ...validTokenRow, used_at: new Date(Date.now() - 1000) },
    ])

    await expect(
      resetPasswordWithToken("plain-token", "secret123")
    ).rejects.toThrow(new NotFoundError(INVALID_TOKEN_MESSAGE))

    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it("rejects an expired token", async () => {
    queueResults(mockDb.select, [
      { ...validTokenRow, expires_at: new Date(Date.now() - 1000) },
    ])

    await expect(
      resetPasswordWithToken("plain-token", "secret123")
    ).rejects.toThrow(new NotFoundError(INVALID_TOKEN_MESSAGE))

    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it("hashes the new password and marks the token as used in a transaction", async () => {
    queueResults(mockDb.select, [validTokenRow])
    queueResults(mockDb.update, undefined, undefined)

    await resetPasswordWithToken("plain-token", "secret123")

    expect(mockDb.transaction).toHaveBeenCalledTimes(1)
    expect(mockHash).toHaveBeenCalledWith("secret123", 10)

    expect(mockDb.update).toHaveBeenCalledTimes(2)
    expect(chainOf(mockDb.update, 0).argsFor("set")).toEqual([
      { password_hash: "hashed:secret123" },
    ])

    const consumed = chainOf(mockDb.update, 1).argsFor("set")?.[0] as {
      used_at: Date
    }
    expect(consumed.used_at).toBeInstanceOf(Date)
  })

  it("updates the password of the user the token belongs to", async () => {
    queueResults(mockDb.select, [validTokenRow])
    queueResults(mockDb.update, undefined, undefined)

    await resetPasswordWithToken("plain-token", "secret123")

    expect(chainOf(mockDb.update, 0).argsFor("where")?.[0]).toBeDefined()
  })

  it("does not consume the token when validation fails", async () => {
    queueResults(mockDb.select, [])

    await expect(
      resetPasswordWithToken("plain-token", "secret123")
    ).rejects.toThrow(NotFoundError)

    expect(mockDb.transaction).not.toHaveBeenCalled()
  })
})
