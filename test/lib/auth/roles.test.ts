import {
  hasAnyRole,
  hasExactRole,
  hasRole,
  isRole,
  ROLES,
  type Role,
} from "@/lib/auth/roles"

describe("isRole", () => {
  it.each(ROLES)("accepts %s", (role) => {
    expect(isRole(role)).toBe(true)
  })

  it.each([["root"], [""], [null], [undefined], [42], [{}]])(
    "rejects %p",
    (value) => {
      expect(isRole(value)).toBe(false)
    },
  )
})

describe("hasRole", () => {
  it("lets a role satisfy its own requirement", () => {
    for (const role of ROLES) {
      expect(hasRole(role, role)).toBe(true)
    }
  })

  it("lets a higher role satisfy a lower requirement", () => {
    expect(hasRole("admin", "teacher")).toBe(true)
    expect(hasRole("admin", "coordinator")).toBe(true)
    expect(hasRole("principal", "coordinator")).toBe(true)
    expect(hasRole("coordinator", "teacher")).toBe(true)
  })

  it("does not let a lower role satisfy a higher requirement", () => {
    expect(hasRole("teacher", "coordinator")).toBe(false)
    expect(hasRole("coordinator", "principal")).toBe(false)
    expect(hasRole("principal", "admin")).toBe(false)
  })

  it("rejects unknown or missing roles", () => {
    expect(hasRole("root", "teacher")).toBe(false)
    expect(hasRole(undefined, "teacher")).toBe(false)
    expect(hasRole(null, "teacher")).toBe(false)
    expect(hasRole("", "teacher")).toBe(false)
  })
})

describe("hasAnyRole", () => {
  it("matches when the role is in the list", () => {
    expect(hasAnyRole("coordinator", ["teacher", "coordinator"])).toBe(true)
  })

  it("does not apply the hierarchy", () => {
    expect(hasAnyRole("admin", ["teacher", "coordinator"])).toBe(false)
  })

  it("rejects an empty list or unknown role", () => {
    expect(hasAnyRole("admin", [])).toBe(false)
    expect(hasAnyRole("root" as unknown as Role, ["admin"])).toBe(false)
  })
})

describe("hasExactRole", () => {
  it("only matches the exact role", () => {
    expect(hasExactRole("admin", "admin")).toBe(true)
    expect(hasExactRole("admin", "principal")).toBe(false)
    expect(hasExactRole(undefined, "admin")).toBe(false)
  })
})
