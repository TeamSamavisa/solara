/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen } from "@testing-library/react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { Role } from "@/lib/auth/roles"

jest.mock("@/app/actions/auth", () => ({ logout: jest.fn() }))
jest.mock("next/navigation", () => ({ usePathname: () => "/shifts" }))

function renderSidebar(role: Role) {
  // Mirrors the wrappers used by the authenticated layout, so a missing
  // provider fails here instead of only at runtime.
  return render(
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar role={role} userName="Ana Souza" />
      </SidebarProvider>
    </TooltipProvider>,
  )
}

describe("AppSidebar", () => {
  it("renders inside the layout providers without throwing", () => {
    expect(() => renderSidebar("admin")).not.toThrow()
  })

  it("always shows the shared entries and the account actions", () => {
    renderSidebar("teacher")

    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute(
      "href",
      "/dashboard",
    )
    expect(
      screen.getByRole("link", { name: "Disponibilidade" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ana Souza" })).toHaveAttribute(
      "href",
      "/profile",
    )
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Alternar tema" }),
    ).toBeInTheDocument()
  })

  it("hides the management areas from a teacher", () => {
    renderSidebar("teacher")

    expect(screen.queryByRole("link", { name: "Alocações" })).toBeNull()
    expect(screen.queryByRole("link", { name: "Usuários" })).toBeNull()
    expect(screen.queryByText("Gestão Acadêmica")).toBeNull()
  })

  it("shows the academic areas to a coordinator but not the admin ones", () => {
    renderSidebar("coordinator")

    expect(screen.getByRole("link", { name: "Alocações" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Turnos" })).toBeInTheDocument()
    expect(screen.getByText("Gestão Acadêmica")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Usuários" })).toBeNull()
  })

  it("shows everything to an admin", () => {
    renderSidebar("admin")

    expect(screen.getByRole("link", { name: "Usuários" })).toHaveAttribute(
      "href",
      "/users",
    )
    expect(screen.getByText("Sistema")).toBeInTheDocument()
  })

  it("marks the current route as active", () => {
    renderSidebar("admin")

    expect(screen.getByRole("link", { name: "Turnos" })).toHaveAttribute(
      "data-active",
      "true",
    )
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute(
      "data-active",
      "false",
    )
  })
})
