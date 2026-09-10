import {
  DEFAULT_REDIRECT,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  safeRedirectPath,
} from "@/lib/auth/definitions"

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(
      loginSchema.parse({ email: "ana@example.com", password: "secret123" }),
    ).toEqual({ email: "ana@example.com", password: "secret123" })
  })

  it("trims the email", () => {
    expect(
      loginSchema.parse({ email: "  ana@example.com  ", password: "x" }).email,
    ).toBe("ana@example.com")
  })

  it.each(["", "ana", "ana@", "@example.com", "ana example.com"])(
    "rejects %p as an email",
    (email) => {
      const result = loginSchema.safeParse({ email, password: "x" })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.message).toBe("Informe um e-mail válido.")
    },
  )

  it("requires a password", () => {
    const result = loginSchema.safeParse({
      email: "ana@example.com",
      password: "",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Informe sua senha.")
  })

  it("reports both fields at once", () => {
    const result = loginSchema.safeParse({ email: "nope", password: "" })
    expect(result.error?.issues).toHaveLength(2)
  })
})

describe("forgotPasswordSchema", () => {
  it("accepts a valid email and trims it", () => {
    expect(
      forgotPasswordSchema.parse({ email: "  ana@example.com  " }),
    ).toEqual({ email: "ana@example.com" })
  })

  it.each(["", "ana", "ana@", "@example.com"])("rejects %p", (email) => {
    const result = forgotPasswordSchema.safeParse({ email })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Informe um e-mail válido.")
  })
})

describe("resetPasswordSchema", () => {
  it("accepts a token with matching passwords", () => {
    expect(
      resetPasswordSchema.parse({
        token: "abc123",
        password: "secret123",
        confirmPassword: "secret123",
      }),
    ).toEqual({
      token: "abc123",
      password: "secret123",
      confirmPassword: "secret123",
    })
  })

  it("requires the token from the recovery link", () => {
    const result = resetPasswordSchema.safeParse({
      token: "",
      password: "secret123",
      confirmPassword: "secret123",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(["token"])
  })

  it("rejects a password shorter than six characters", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "123",
      confirmPassword: "123",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "A senha deve ter ao menos 6 caracteres.",
    )
  })

  it("requires the confirmation", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "secret123",
      confirmPassword: "",
    })
    expect(result.success).toBe(false)
  })

  it("reports mismatched passwords on the confirmation field", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "secret123",
      confirmPassword: "different",
    })
    expect(result.success).toBe(false)
    const issue = result.error?.issues[0]
    expect(issue?.path).toEqual(["confirmPassword"])
    expect(issue?.message).toBe("As senhas não coincidem.")
  })
})

describe("safeRedirectPath", () => {
  it("keeps a same-origin path", () => {
    expect(safeRedirectPath("/teachers")).toBe("/teachers")
    expect(safeRedirectPath("/spaces?page=2")).toBe("/spaces?page=2")
  })

  it("falls back when nothing is provided", () => {
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_REDIRECT)
    expect(safeRedirectPath("")).toBe(DEFAULT_REDIRECT)
    expect(safeRedirectPath(null)).toBe(DEFAULT_REDIRECT)
    expect(safeRedirectPath(42)).toBe(DEFAULT_REDIRECT)
  })

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "http://localhost:3000/dashboard",
  ])("refuses the off-site target %p", (target) => {
    expect(safeRedirectPath(target)).toBe(DEFAULT_REDIRECT)
  })

  it("accepts a custom fallback", () => {
    expect(safeRedirectPath("https://evil.com", "/login")).toBe("/login")
  })
})
