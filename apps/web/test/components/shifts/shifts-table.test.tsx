/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ShiftsTable } from "@/components/shifts/shifts-table"
import type { Shift } from "@solara/db/schemas"

jest.mock("@/app/(authenticated)/shifts/actions", () => ({
  createShiftAction: jest.fn(),
  updateShiftAction: jest.fn(),
  deleteShiftAction: jest.fn(),
}))

const shifts = [
  { id: 1, name: "Matutino" },
  { id: 2, name: "Noturno" },
] as Shift[]

describe("ShiftsTable", () => {
  it("lists every shift", () => {
    render(<ShiftsTable shifts={shifts} canManage={false} />)

    expect(screen.getByText("Matutino")).toBeInTheDocument()
    expect(screen.getByText("Noturno")).toBeInTheDocument()
  })

  it("hides the actions column from users who cannot manage shifts", () => {
    render(<ShiftsTable shifts={shifts} canManage={false} />)

    expect(screen.queryByText("Ações")).toBeNull()
    expect(screen.queryByLabelText("Editar Matutino")).toBeNull()
    expect(screen.queryByLabelText("Excluir Matutino")).toBeNull()
  })

  it("shows edit and delete controls for managers", () => {
    render(<ShiftsTable shifts={shifts} canManage />)

    expect(screen.getByText("Ações")).toBeInTheDocument()
    expect(screen.getByLabelText("Editar Matutino")).toBeInTheDocument()
    expect(screen.getByLabelText("Excluir Noturno")).toBeInTheDocument()
  })

  it("shows an empty state instead of a bare table", () => {
    render(<ShiftsTable shifts={[]} canManage />)

    expect(screen.getByText("Nenhum turno encontrado.")).toBeInTheDocument()
    expect(screen.queryByRole("table")).toBeNull()
  })

  it("opens the edit dialog prefilled with the shift name", async () => {
    const user = userEvent.setup()
    render(<ShiftsTable shifts={shifts} canManage />)

    await user.click(screen.getByLabelText("Editar Matutino"))

    expect(
      await screen.findByRole("heading", { name: "Editar Turno" })
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Nome")).toHaveValue("Matutino")
  })

  it("asks for confirmation before deleting", async () => {
    const user = userEvent.setup()
    render(<ShiftsTable shifts={shifts} canManage />)

    await user.click(screen.getByLabelText("Excluir Noturno"))

    const dialog = await screen.findByRole("alertdialog")
    expect(
      within(dialog).getByRole("heading", { name: "Confirmar exclusão" })
    ).toBeInTheDocument()
    expect(dialog).toHaveTextContent(
      "Tem certeza que deseja excluir o turno Noturno?"
    )
    expect(
      within(dialog).getByRole("button", { name: "Excluir" })
    ).toBeInTheDocument()
  })
})
