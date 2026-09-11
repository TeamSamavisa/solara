import { renderEmailTemplate } from "@/lib/mail/templates"

describe("renderEmailTemplate password-reset", () => {
  const context = {
    name: "Ana Souza",
    resetUrl: "http://localhost:3000/reset-password?token=abc123",
    expiresInMinutes: 60,
  }

  it("greets the user by name", () => {
    const html = renderEmailTemplate("password-reset", context)

    expect(html).toContain("Ana Souza")
  })

  it("embeds the reset link in an anchor", () => {
    const html = renderEmailTemplate("password-reset", context)

    expect(html).toContain(
      'href="http://localhost:3000/reset-password?token=abc123"'
    )
  })

  it("tells for how long the link stays valid", () => {
    const html = renderEmailTemplate("password-reset", context)

    expect(html).toContain("60 minutos")
  })

  it("escapes HTML injected through the user name", () => {
    const html = renderEmailTemplate("password-reset", {
      ...context,
      name: '<img src=x onerror="alert(1)">',
    })

    expect(html).not.toContain("<img")
    expect(html).toContain("&lt;img")
  })

  it("throws for a template that does not exist", () => {
    expect(() => renderEmailTemplate("no-such-template", context)).toThrow()
  })
})

describe("renderEmailTemplate first-access", () => {
  const context = {
    name: "Ana Souza",
    accessUrl: "http://localhost:3000/first-access?token=abc123",
    expiresInHours: 24,
  }

  it("greets the user by name", () => {
    const html = renderEmailTemplate("first-access", context)

    expect(html).toContain("Ana Souza")
  })

  it("explains the account was created and must be validated", () => {
    const html = renderEmailTemplate("first-access", context)

    expect(html).toContain("conta")
    expect(html).toContain("senha")
  })

  it("embeds the first access link in an anchor", () => {
    const html = renderEmailTemplate("first-access", context)

    expect(html).toContain(
      'href="http://localhost:3000/first-access?token=abc123"'
    )
  })

  it("tells for how many hours the link stays valid", () => {
    const html = renderEmailTemplate("first-access", context)

    expect(html).toContain("24 horas")
  })

  it("escapes HTML injected through the user name", () => {
    const html = renderEmailTemplate("first-access", {
      ...context,
      name: '<img src=x onerror="alert(1)">',
    })

    expect(html).not.toContain("<img")
    expect(html).toContain("&lt;img")
  })
})
