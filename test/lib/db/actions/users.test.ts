import { hash } from "bcryptjs"
import { ZodError } from "zod"

import {
  createUser,
  getUserByEmail,
  getUserById,
  listTeachers,
  listUsers,
  removeUser,
  updateUser,
} from "@/lib/db/actions/users"
import { db } from "@/lib/db/client"
import { ConflictError, NotFoundError } from "@/lib/db/errors"
import type { UpdateUserInput } from "@/lib/db/schemas"
import {
  chainOf,
  queueResults,
  resetMockDb,
  type MockDb,
} from "@/test/support/db"

jest.mock("@/lib/db/client", () => ({
  db: jest.requireActual("@/test/support/db").createMockDb(),
}))

jest.mock("bcryptjs", () => ({
  hash: jest.fn(async (value: string) => `hashed:${value}`),
}))

const mockDb = db as unknown as MockDb
const mockHash = hash as jest.MockedFunction<typeof hash>

const publicUser = {
  id: 5,
  full_name: "Ana Souza",
  registration: "20240001",
  email: "ana@example.com",
  role: "teacher",
}

beforeEach(() => {
  resetMockDb(mockDb)
  mockHash.mockClear()
  mockHash.mockImplementation(async (value: string) => `hashed:${value}`)
})

describe("createUser", () => {
  it("hashes the password and returns the user without the hash", async () => {
    queueResults(mockDb.select, [])
    queueResults(mockDb.insert, [{ id: 5 }])
    queueResults(mockDb.select, [publicUser])

    const result = await createUser({
      full_name: "Ana Souza",
      email: "ana@example.com",
      password: "secret123",
    })

    expect(result).toEqual(publicUser)
    expect(result).not.toHaveProperty("password_hash")
    expect(mockHash).toHaveBeenCalledWith("secret123", 10)
    expect(chainOf(mockDb.insert).argsFor("values")).toEqual([
      {
        full_name: "Ana Souza",
        email: "ana@example.com",
        registration: undefined,
        role: "teacher",
        password_hash: "hashed:secret123",
      },
    ])
  })

  it("defaults the role to teacher and honours an explicit role", async () => {
    queueResults(mockDb.select, [])
    queueResults(mockDb.insert, [{ id: 5 }])
    queueResults(mockDb.select, [publicUser])

    await createUser({
      full_name: "Ana",
      email: "ana@example.com",
      password: "secret123",
      role: "coordinator",
    })

    const values = chainOf(mockDb.insert).argsFor("values")?.[0] as {
      role: string
    }
    expect(values.role).toBe("coordinator")
  })

  it("generates a random password when none is supplied", async () => {
    queueResults(mockDb.select, [])
    queueResults(mockDb.insert, [{ id: 5 }])
    queueResults(mockDb.select, [publicUser])

    await createUser({ full_name: "Ana", email: "ana@example.com" })

    expect(mockHash).toHaveBeenCalledTimes(1)
    const [generated, rounds] = mockHash.mock.calls[0]
    expect(typeof generated).toBe("string")
    expect(generated).toHaveLength(8)
    expect(rounds).toBe(10)
  })

  it("checks the registration when one is supplied", async () => {
    queueResults(mockDb.select, [], [])
    queueResults(mockDb.insert, [{ id: 5 }])
    queueResults(mockDb.select, [publicUser])

    await createUser({
      full_name: "Ana",
      email: "ana@example.com",
      password: "secret123",
      registration: "20240001",
    })

    expect(mockDb.select).toHaveBeenCalledTimes(3)
  })

  it("rejects a duplicated email", async () => {
    queueResults(mockDb.select, [{ id: 9 }])

    await expect(
      createUser({
        full_name: "Ana",
        email: "ana@example.com",
        password: "secret123",
      }),
    ).rejects.toThrow(new ConflictError("Este e-mail já está em uso."))

    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it("rejects a duplicated registration", async () => {
    queueResults(mockDb.select, [], [{ id: 9 }])

    await expect(
      createUser({
        full_name: "Ana",
        email: "ana@example.com",
        password: "secret123",
        registration: "20240001",
      }),
    ).rejects.toThrow(new ConflictError("Esta matrícula já está em uso."))

    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it("rejects an invalid payload before any query", async () => {
    await expect(
      createUser({ full_name: "Ana", email: "not-an-email" }),
    ).rejects.toBeInstanceOf(ZodError)

    expect(mockDb.select).not.toHaveBeenCalled()
  })

  it("rejects a password shorter than six characters", async () => {
    await expect(
      createUser({
        full_name: "Ana",
        email: "ana@example.com",
        password: "123",
      }),
    ).rejects.toBeInstanceOf(ZodError)
  })
})

describe("listUsers", () => {
  it("returns the paginated users", async () => {
    queueResults(mockDb.select, [publicUser], [{ value: 1 }])

    await expect(listUsers({})).resolves.toEqual({
      content: [publicUser],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false,
      },
    })
  })

  it("never selects the password hash", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listUsers({})

    const selection = mockDb.select.mock.calls[0][0] as Record<string, unknown>
    expect(Object.keys(selection)).not.toContain("password_hash")
  })

  it("applies the text filters and pagination", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listUsers({ full_name: "Ana", page: 2, limit: 5 })

    const rowsQuery = chainOf(mockDb.select, 0)
    expect(rowsQuery.argsFor("where")?.[0]).toBeDefined()
    expect(rowsQuery.argsFor("offset")).toEqual([5])
  })

  it("ignores empty filters", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listUsers({ full_name: "", email: "" })

    expect(chainOf(mockDb.select, 0).argsFor("where")).toEqual([undefined])
  })
})

describe("listTeachers", () => {
  it("always restricts the roles, even without filters", async () => {
    queueResults(mockDb.select, [], [{ value: 0 }])

    await listTeachers({})

    expect(chainOf(mockDb.select, 0).argsFor("where")?.[0]).toBeDefined()
  })

  it("returns the paginated teachers", async () => {
    queueResults(mockDb.select, [publicUser], [{ value: 1 }])

    const result = await listTeachers({})

    expect(result.content).toEqual([publicUser])
  })
})

describe("getUserById", () => {
  it("returns the user without the password hash", async () => {
    queueResults(mockDb.select, [publicUser])

    await expect(getUserById(5)).resolves.toEqual(publicUser)
  })

  it("throws NotFoundError for an unknown user", async () => {
    queueResults(mockDb.select, [])

    await expect(getUserById(404)).rejects.toThrow(
      new NotFoundError("Usuário não encontrado."),
    )
  })
})

describe("getUserByEmail", () => {
  it("returns the credentials needed to authenticate", async () => {
    const credentials = {
      id: 5,
      email: "ana@example.com",
      role: "teacher",
      password_hash: "hashed:secret123",
    }
    queueResults(mockDb.select, [credentials])

    await expect(getUserByEmail("ana@example.com")).resolves.toEqual(
      credentials,
    )
  })

  it("throws NotFoundError when the email is unknown", async () => {
    queueResults(mockDb.select, [])

    await expect(getUserByEmail("nobody@example.com")).rejects.toThrow(
      new NotFoundError("Usuário não encontrado."),
    )
  })
})

describe("updateUser", () => {
  it("updates the supplied fields", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [publicUser])
    queueResults(mockDb.update, undefined)

    await expect(updateUser(5, { full_name: "Ana Paula" })).resolves.toEqual(
      publicUser,
    )
    expect(chainOf(mockDb.update).argsFor("set")).toEqual([
      { full_name: "Ana Paula" },
    ])
  })

  it("hashes a new password into password_hash", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [publicUser])
    queueResults(mockDb.update, undefined)

    await updateUser(5, { password: "novaSenha" })

    expect(mockHash).toHaveBeenCalledWith("novaSenha", 10)
    expect(chainOf(mockDb.update).argsFor("set")).toEqual([
      { password_hash: "hashed:novaSenha" },
    ])
  })

  it("rejects an email already taken by another user", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [{ id: 9 }])

    await expect(
      updateUser(5, { email: "taken@example.com" }),
    ).rejects.toThrow(new ConflictError("Este e-mail já está em uso."))

    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it("allows keeping the same email, since the user itself is excluded", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [], [publicUser])
    queueResults(mockDb.update, undefined)

    await expect(
      updateUser(5, { email: "ana@example.com" }),
    ).resolves.toEqual(publicUser)
  })

  it("rejects a registration already taken by another user", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [{ id: 9 }])

    await expect(updateUser(5, { registration: "20240001" })).rejects.toThrow(
      new ConflictError("Esta matrícula já está em uso."),
    )
  })

  it("skips the update statement when nothing changes", async () => {
    queueResults(mockDb.select, [{ id: 5 }], [publicUser])

    await expect(updateUser(5, {})).resolves.toEqual(publicUser)
    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it("throws NotFoundError for an unknown user", async () => {
    queueResults(mockDb.select, [])

    await expect(updateUser(404, { full_name: "x" })).rejects.toThrow(
      new NotFoundError("Usuário não encontrado."),
    )
    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it("rejects an invalid payload", async () => {
    // `root` is not part of the role enum, so it is forced past the compiler
    // to prove the runtime validation rejects it too.
    await expect(
      updateUser(5, { role: "root" } as unknown as UpdateUserInput),
    ).rejects.toBeInstanceOf(ZodError)
    expect(mockDb.select).not.toHaveBeenCalled()
  })
})

describe("removeUser", () => {
  it("deletes the user and returns it", async () => {
    queueResults(mockDb.select, [publicUser])
    queueResults(mockDb.delete, undefined)

    await expect(removeUser(5)).resolves.toEqual(publicUser)
    expect(mockDb.delete).toHaveBeenCalledTimes(1)
  })

  it("throws NotFoundError and deletes nothing", async () => {
    queueResults(mockDb.select, [])

    await expect(removeUser(404)).rejects.toThrow(NotFoundError)
    expect(mockDb.delete).not.toHaveBeenCalled()
  })
})
