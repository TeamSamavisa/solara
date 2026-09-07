import {
  isActiveNavItem,
  NAV_GROUPS,
  visibleNavGroups,
  visibleNavHrefs,
} from "@/lib/navigation"

describe("NAV_GROUPS", () => {
  it("keeps every href unique", () => {
    const hrefs = NAV_GROUPS.flatMap((group) =>
      group.items.map((item) => item.href),
    )

    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it("keeps the legacy paths, including the underscore ones", () => {
    const hrefs = visibleNavHrefs("admin")

    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/availability",
        "/assignments",
        "/class_groups",
        "/teachers",
        "/subjects",
        "/schedules",
        "/shifts",
        "/courses",
        "/course-types",
        "/spaces",
        "/space_types",
        "/users",
      ]),
    )
  })
})

describe("visibleNavGroups", () => {
  it("shows a teacher only the shared entries", () => {
    expect(visibleNavHrefs("teacher")).toEqual([
      "/dashboard",
      "/availability",
    ])
  })

  it("adds the academic areas for a coordinator", () => {
    const hrefs = visibleNavHrefs("coordinator")

    expect(hrefs).toContain("/assignments")
    expect(hrefs).toContain("/spaces")
    expect(hrefs).not.toContain("/users")
  })

  it("gives a principal the same reach as a coordinator, minus admin areas", () => {
    expect(visibleNavHrefs("principal")).toEqual(visibleNavHrefs("coordinator"))
  })

  it("gives an admin everything", () => {
    expect(visibleNavHrefs("admin")).toContain("/users")
    expect(visibleNavGroups("admin")).toHaveLength(NAV_GROUPS.length)
  })

  it("shows nothing for an unknown or missing role", () => {
    expect(visibleNavGroups("root")).toEqual([])
    expect(visibleNavGroups(undefined)).toEqual([])
    expect(visibleNavGroups(null)).toEqual([])
  })

  it("never leaks an admin-only link to a lower role", () => {
    for (const role of ["teacher", "coordinator", "principal"]) {
      expect(visibleNavHrefs(role)).not.toContain("/users")
    }
  })
})

describe("isActiveNavItem", () => {
  it("matches the exact route", () => {
    expect(isActiveNavItem("/spaces", "/spaces")).toBe(true)
  })

  it("matches a nested route", () => {
    expect(isActiveNavItem("/spaces/12/edit", "/spaces")).toBe(true)
  })

  it("does not match a sibling that shares a prefix", () => {
    expect(isActiveNavItem("/space_types", "/spaces")).toBe(false)
    expect(isActiveNavItem("/courses", "/course-types")).toBe(false)
  })

  it("does not match an unrelated route", () => {
    expect(isActiveNavItem("/dashboard", "/spaces")).toBe(false)
  })
})
