/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import {
  DialogTriggerButton,
  type DialogTriggerSpec,
} from "@/components/shared/dialog-trigger"

describe("DialogTriggerButton", () => {
  it("shows the label when there is one", () => {
    render(<DialogTriggerButton icon="add" label="Adicionar Turno" />)

    expect(
      screen.getByRole("button", { name: "Adicionar Turno" })
    ).toBeInTheDocument()
  })

  it("names an icon-only button through its aria-label", () => {
    render(<DialogTriggerButton icon="edit" ariaLabel="Editar Matutino" />)

    expect(
      screen.getByRole("button", { name: "Editar Matutino" })
    ).toBeInTheDocument()
  })

  it("renders an icon for every supported kind", () => {
    const icons: DialogTriggerSpec["icon"][] = [
      "add",
      "edit",
      "delete",
      "availability",
    ]

    for (const icon of icons) {
      const { container, unmount } = render(
        <DialogTriggerButton icon={icon} ariaLabel={icon} />
      )

      expect(container.querySelector("svg")).toBeInTheDocument()
      unmount()
    }
  })

  /**
   * Radix clones the trigger through `asChild`, so anything it injects has to
   * reach the underlying button or the dialog never opens.
   */
  it("forwards the props Radix injects", async () => {
    const onClick = jest.fn()

    render(
      <DialogTriggerButton
        icon="add"
        label="Adicionar"
        onClick={onClick}
        aria-haspopup="dialog"
        data-state="closed"
      />
    )

    const button = screen.getByRole("button", { name: "Adicionar" })
    expect(button).toHaveAttribute("aria-haspopup", "dialog")
    expect(button).toHaveAttribute("data-state", "closed")

    await userEvent.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("keeps an explicit type, so it never submits a surrounding form", () => {
    render(<DialogTriggerButton icon="delete" ariaLabel="Excluir" />)

    expect(screen.getByRole("button", { name: "Excluir" })).toHaveAttribute(
      "type",
      "button"
    )
  })

  it("lets the caller override the styling", () => {
    render(
      <DialogTriggerButton
        icon="add"
        label="Adicionar"
        variant="outline"
        size="sm"
      />
    )

    const button = screen.getByRole("button", { name: "Adicionar" })
    expect(button).toHaveAttribute("data-variant", "outline")
    expect(button).toHaveAttribute("data-size", "sm")
  })
})
