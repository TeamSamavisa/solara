import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  USER_ROLES,
} from "@/schemas/users"

describe("createUserSchema", () => {
  it("accepts the minimum payload", () => {
    expect(
      createUserSchema.parse({
        full_name: "Ana Souza",
        email: "ana@example.com",
      }),
    ).toEqual({ full_name: "Ana Souza", email: "ana@example.com" })
  })

  it("accepts the full payload", () => {
    const input = {
      full_name: "Ana Souza",
      email: "ana@example.com",
      password: "secret123",
      registration: "20240001",
      role: "coordinator",
    }
    expect(createUserSchema.parse(input)).toEqual(input)
  })

  it("rejects an empty full name", () => {
    const result = createUserSchema.safeParse({
      full_name: "",
      email: "ana@example.com",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Informe o nome completo.")
  })

  it.each(["not-an-email", "ana@", "@example.com", ""])(
    "rejects %p as an email",
    (email) => {
      const result = createUserSchema.safeParse({ full_name: "Ana", email })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.message).toBe("Informe um e-mail válido.")
    },
  )

  it("requires the password to be at least 6 characters when supplied", () => {
    const result = createUserSchema.safeParse({
      full_name: "Ana",
      email: "ana@example.com",
      password: "12345",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "A senha deve ter ao menos 6 caracteres.",
    )
  })

  it("accepts a password of exactly 6 characters", () => {
    expect(
      createUserSchema.parse({
        full_name: "Ana",
        email: "ana@example.com",
        password: "123456",
      }).password,
    ).toBe("123456")
  })

  it.each(["abc", "2024-1", "20a24", ""])(
    "rejects %p as a registration",
    (registration) => {
      const result = createUserSchema.safeParse({
        full_name: "Ana",
        email: "ana@example.com",
        registration,
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.message).toBe(
        "A matrícula deve conter apenas números.",
      )
    },
  )

  it.each(USER_ROLES)("accepts the %s role", (role) => {
    expect(
      createUserSchema.parse({
        full_name: "Ana",
        email: "ana@example.com",
        role,
      }).role,
    ).toBe(role)
  })

  it("rejects an unknown role", () => {
    const result = createUserSchema.safeParse({
      full_name: "Ana",
      email: "ana@example.com",
      role: "root",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "Selecione um cargo válido.",
    )
  })

  it("does not accept a password hash from the caller", () => {
    expect(
      createUserSchema.parse({
        full_name: "Ana",
        email: "ana@example.com",
        password_hash: "injected",
      }),
    ).not.toHaveProperty("password_hash")
  })
})

describe("updateUserSchema", () => {
  it("accepts an empty payload", () => {
    expect(updateUserSchema.parse({})).toEqual({})
  })

  it("accepts changing only the email", () => {
    expect(updateUserSchema.parse({ email: "novo@example.com" })).toEqual({
      email: "novo@example.com",
    })
  })

  it("still validates the fields that are present", () => {
    expect(updateUserSchema.safeParse({ email: "nope" }).success).toBe(false)
    expect(updateUserSchema.safeParse({ password: "123" }).success).toBe(false)
    expect(updateUserSchema.safeParse({ role: "root" }).success).toBe(false)
  })
})

describe("listUsersQuerySchema", () => {
  it("applies the pagination defaults", () => {
    expect(listUsersQuerySchema.parse({})).toEqual({ limit: 10, page: 1 })
  })

  it("accepts the text filters", () => {
    expect(
      listUsersQuerySchema.parse({
        full_name: "Ana",
        email: "ana@example.com",
        registration: "20240001",
      }),
    ).toEqual({
      limit: 10,
      page: 1,
      full_name: "Ana",
      email: "ana@example.com",
      registration: "20240001",
    })
  })

  it("does not require the email filter to be a valid address", () => {
    expect(listUsersQuerySchema.safeParse({ email: "ana" }).success).toBe(true)
  })
})
