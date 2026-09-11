import {
  isAuthRoute,
  isNeutralRoute,
  resolveRedirect,
} from "@/lib/auth/proxy-rules"

describe("isAuthRoute", () => {
  it("matches the login page", () => {
    expect(isAuthRoute("/login")).toBe(true)
  })

  it("matches the account recovery pages", () => {
    expect(isAuthRoute("/forgot-password")).toBe(true)
    expect(isAuthRoute("/reset-password")).toBe(true)
  })

  it("matches the first access page", () => {
    expect(isAuthRoute("/first-access")).toBe(true)
  })

  it("does not match anything else", () => {
    expect(isAuthRoute("/dashboard")).toBe(false)
    expect(isAuthRoute("/login/extra")).toBe(false)
  })
})

describe("isNeutralRoute", () => {
  it("matches the error pages", () => {
    expect(isNeutralRoute("/error")).toBe(true)
    expect(isNeutralRoute("/error/403")).toBe(true)
    expect(isNeutralRoute("/error/404")).toBe(true)
  })

  it("does not match a route that merely starts with the same letters", () => {
    expect(isNeutralRoute("/errors")).toBe(false)
    expect(isNeutralRoute("/dashboard")).toBe(false)
  })
})

describe("resolveRedirect while signed out", () => {
  it("sends a protected route to the login page and remembers the target", () => {
    expect(resolveRedirect({ pathname: "/teachers", hasSession: false })).toBe(
      "/login?redirectTo=%2Fteachers"
    )
  })

  it("keeps the query string in the remembered target", () => {
    expect(
      resolveRedirect({
        pathname: "/spaces",
        search: "?page=2&name=Lab",
        hasSession: false,
      })
    ).toBe("/login?redirectTo=%2Fspaces%3Fpage%3D2%26name%3DLab")
  })

  it("lets the login page render", () => {
    expect(
      resolveRedirect({ pathname: "/login", hasSession: false })
    ).toBeNull()
  })

  it("lets the recovery pages render", () => {
    expect(
      resolveRedirect({ pathname: "/forgot-password", hasSession: false })
    ).toBeNull()
    expect(
      resolveRedirect({ pathname: "/reset-password", hasSession: false })
    ).toBeNull()
  })

  it("lets the first access page render", () => {
    expect(
      resolveRedirect({ pathname: "/first-access", hasSession: false })
    ).toBeNull()
  })

  it("sends the root to the login page", () => {
    expect(resolveRedirect({ pathname: "/", hasSession: false })).toBe("/login")
  })

  it("lets the error pages render", () => {
    expect(
      resolveRedirect({ pathname: "/error/404", hasSession: false })
    ).toBeNull()
  })
})

describe("resolveRedirect while signed in", () => {
  it("lets a protected route render", () => {
    expect(
      resolveRedirect({ pathname: "/teachers", hasSession: true })
    ).toBeNull()
  })

  it("bounces the login page to the dashboard", () => {
    expect(resolveRedirect({ pathname: "/login", hasSession: true })).toBe(
      "/dashboard"
    )
  })

  it("bounces the recovery pages to the dashboard", () => {
    expect(
      resolveRedirect({ pathname: "/forgot-password", hasSession: true })
    ).toBe("/dashboard")
    expect(
      resolveRedirect({ pathname: "/reset-password", hasSession: true })
    ).toBe("/dashboard")
  })

  it("bounces the first access page to the dashboard", () => {
    expect(
      resolveRedirect({ pathname: "/first-access", hasSession: true })
    ).toBe("/dashboard")
  })

  it("sends the root to the dashboard", () => {
    expect(resolveRedirect({ pathname: "/", hasSession: true })).toBe(
      "/dashboard"
    )
  })

  it("still lets the 403 page render, so authorization does not loop", () => {
    expect(
      resolveRedirect({ pathname: "/error/403", hasSession: true })
    ).toBeNull()
  })
})
