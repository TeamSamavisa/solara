import { hash } from "bcryptjs"
import type { SQL } from "drizzle-orm"
import { MySqlDialect } from "drizzle-orm/mysql-core"
import { createHash } from "node:crypto"
import { ZodError } from "zod"

import {
  activateAccountWithToken,
  createFirstAccessToken,
  FIRST_ACCESS_TOKEN_TTL_MS,
} from "@/actions/first-access-tokens"
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

const INVALID_TOKEN_MESSAGE = "Token de primeiro acesso inválido ou expirado."

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

const dialect = new MySqlDialect()

/**
 * Compiles the `where` clause of the n-th call of a mocked query root, so
 * tests can assert which column and value a query actually filters on.
 */
function compiledWhere(mock: jest.Mock, callIndex = 0) {
  const where = chainOf(mock, callIndex).argsFor("where")?.[0] as SQL
  return dialect.sqlToQuery(where)
}

const validTokenRow = {
  id: 3,
  user_id: 5,
  token_hash: sha256("plain-token"),
  expires_at: new Date(Date.now() + FIRST_ACCESS_TOKEN_TTL_MS),
  used_at: null,
}

beforeEach(() => {
  resetMockDb(mockDb)
  mockHash.mockClear()
  mockHash.mockImplementation(async (value: string) => `hashed:${value}`)
})

describe("createFirstAccessToken", () => {
  it("returns a random plaintext token and persists only its hash", async () => {
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)

    const token = await createFirstAccessToken(5)

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

    const first = await createFirstAccessToken(5)
    const second = await createFirstAccessToken(5)

    expect(first).not.toBe(second)
  })

  it("gives the token a limited lifetime", async () => {
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)

    const before = Date.now()
    await createFirstAccessToken(5)
    const after = Date.now()

    const values = chainOf(mockDb.insert).argsFor("values")?.[0] as {
      expires_at: Date
    }
    expect(values.expires_at.getTime()).toBeGreaterThanOrEqual(
      before + FIRST_ACCESS_TOKEN_TTL_MS
    )
    expect(values.expires_at.getTime()).toBeLessThanOrEqual(
      after + FIRST_ACCESS_TOKEN_TTL_MS
    )
  })

  it("invalidates the user's previous tokens before issuing a new one", async () => {
    queueResults(mockDb.delete, undefined)
    queueResults(mockDb.insert, undefined)

    await createFirstAccessToken(5)

    expect(mockDb.delete).toHaveBeenCalledTimes(1)
    // The delete must be scoped to this user, or it would wipe everyone's
    // tokens whenever anyone is created.
    const deleted = compiledWhere(mockDb.delete)
    expect(deleted.sql).toContain("`user_id`")
    expect(deleted.params).toEqual([5])
    // The delete must happen before the insert, otherwise the new token
    // would be removed too.
    const deleteOrder = mockDb.delete.mock.invocationCallOrder[0]
    const insertOrder = mockDb.insert.mock.invocationCallOrder[0]
    expect(deleteOrder).toBeLessThan(insertOrder)
  })
})

describe("activateAccountWithToken validation", () => {
  it("rejects an empty token before any query", async () => {
    await expect(activateAccountWithToken("", "secret123")).rejects.toThrow(
      ZodError
    )
    expect(mockDb.select).not.toHaveBeenCalled()
  })

  it("rejects a password shorter than six characters", async () => {
    await expect(
      activateAccountWithToken("plain-token", "123")
    ).rejects.toThrow(ZodError)
    expect(mockDb.select).not.toHaveBeenCalled()
  })
})

describe("activateAccountWithToken", () => {
  it("looks the token up by its hash, never by the plaintext value", async () => {
    queueResults(mockDb.select, [validTokenRow])
    queueResults(mockDb.update, [{ affectedRows: 1 }], undefined)

    await activateAccountWithToken("plain-token", "secret123")

    const lookup = compiledWhere(mockDb.select, 0)
    expect(lookup.sql).toContain("`token_hash`")
    expect(lookup.params).toEqual([sha256("plain-token")])
    expect(mockDb.select).toHaveBeenCalledTimes(1)
  })

  it("rejects an unknown token without touching any record", async () => {
    queueResults(mockDb.select, [])

    await expect(
      activateAccountWithToken("plain-token", "secret123")
    ).rejects.toThrow(new NotFoundError(INVALID_TOKEN_MESSAGE))

    expect(mockDb.update).not.toHaveBeenCalled()
    expect(mockHash).not.toHaveBeenCalled()
  })

  it("rejects an already used token", async () => {
    queueResults(mockDb.select, [
      { ...validTokenRow, used_at: new Date(Date.now() - 1000) },
    ])

    await expect(
      activateAccountWithToken("plain-token", "secret123")
    ).rejects.toThrow(new NotFoundError(INVALID_TOKEN_MESSAGE))

    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it("rejects an expired token", async () => {
    queueResults(mockDb.select, [
      { ...validTokenRow, expires_at: new Date(Date.now() - 1000) },
    ])

    await expect(
      activateAccountWithToken("plain-token", "secret123")
    ).rejects.toThrow(new NotFoundError(INVALID_TOKEN_MESSAGE))

    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it("hashes the password and marks the token as used in a transaction", async () => {
    queueResults(mockDb.select, [validTokenRow])
    queueResults(mockDb.update, [{ affectedRows: 1 }], undefined)

    await activateAccountWithToken("plain-token", "secret123")

    expect(mockDb.transaction).toHaveBeenCalledTimes(1)
    expect(mockHash).toHaveBeenCalledWith("secret123", 10)

    expect(mockDb.update).toHaveBeenCalledTimes(2)
    // The token is consumed first — conditionally, so a concurrent request
    // cannot reuse it — and only then is the password updated.
    const consumed = chainOf(mockDb.update, 0).argsFor("set")?.[0] as {
      used_at: Date
    }
    expect(consumed.used_at).toBeInstanceOf(Date)
    expect(chainOf(mockDb.update, 1).argsFor("set")).toEqual([
      { password_hash: "hashed:secret123" },
    ])
  })

  it("consumes the token atomically, scoped to the row it found", async () => {
    queueResults(mockDb.select, [validTokenRow])
    queueResults(mockDb.update, [{ affectedRows: 1 }], undefined)

    await activateAccountWithToken("plain-token", "secret123")

    const consume = compiledWhere(mockDb.update, 0)
    expect(consume.sql).toContain("`id`")
    expect(consume.sql).toContain("`used_at`")
    expect(consume.params).toEqual([validTokenRow.id])
  })

  it("rejects a token a concurrent request consumed first", async () => {
    queueResults(mockDb.select, [validTokenRow])
    // The conditional consume matched no row: used_at was already set.
    queueResults(mockDb.update, [{ affectedRows: 0 }])

    await expect(
      activateAccountWithToken("plain-token", "secret123")
    ).rejects.toThrow(new NotFoundError(INVALID_TOKEN_MESSAGE))

    // The password is never touched when the consume loses the race.
    expect(mockDb.update).toHaveBeenCalledTimes(1)
  })

  it("updates the password of the user the token belongs to", async () => {
    queueResults(mockDb.select, [validTokenRow])
    queueResults(mockDb.update, [{ affectedRows: 1 }], undefined)

    await activateAccountWithToken("plain-token", "secret123")

    const updated = compiledWhere(mockDb.update, 1)
    expect(updated.sql).toContain("`users`.`id`")
    expect(updated.params).toEqual([validTokenRow.user_id])
  })

  it("does not consume the token when validation fails", async () => {
    queueResults(mockDb.select, [])

    await expect(
      activateAccountWithToken("plain-token", "secret123")
    ).rejects.toThrow(NotFoundError)

    expect(mockDb.transaction).not.toHaveBeenCalled()
  })
})
