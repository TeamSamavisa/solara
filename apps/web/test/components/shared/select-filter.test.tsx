/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { SelectFilter } from "@/components/shared/select-filter"
import { WEEKDAYS } from "@/lib/weekdays"

function renderFilter(defaultValue?: string) {
  return render(
    <form data-testid="filters">
      <SelectFilter
        id="weekday"
        name="weekday"
        options={WEEKDAYS}
        defaultValue={defaultValue}
      />
    </form>
  )
}

function submittedValue(container: HTMLElement) {
  const hidden = container.querySelector<HTMLInputElement>(
    'input[name="weekday"]'
  )

  return hidden?.value
}

describe("SelectFilter", () => {
  it("starts on the catch-all option when no filter is active", () => {
    const { container } = renderFilter()

    expect(screen.getByRole("combobox")).toHaveTextContent("Todos")
    // Nothing is submitted, so the URL stays free of a placeholder value.
    expect(submittedValue(container)).toBeUndefined()
  })

  it("shows the active filter coming from the URL", () => {
    renderFilter("Wednesday")

    expect(screen.getByRole("combobox")).toHaveTextContent("Quarta")
  })

  it("submits the active filter through a hidden input", () => {
    const { container } = renderFilter("Wednesday")

    expect(submittedValue(container)).toBe("Wednesday")
  })

  it("lists the catch-all option plus every option", async () => {
    const user = userEvent.setup()
    renderFilter()

    await user.click(screen.getByRole("combobox"))

    const options = await screen.findAllByRole("option")
    expect(options).toHaveLength(WEEKDAYS.length + 1)
    expect(screen.getByRole("option", { name: "Todos" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Segunda" })).toBeInTheDocument()
  })

  it("submits the option the user picks", async () => {
    const user = userEvent.setup()
    const { container } = renderFilter()

    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Sexta" }))

    expect(submittedValue(container)).toBe("Friday")
    expect(screen.getByRole("combobox")).toHaveTextContent("Sexta")
  })

  it("clears the filter when the user goes back to the catch-all option", async () => {
    const user = userEvent.setup()
    const { container } = renderFilter("Wednesday")

    await user.click(screen.getByRole("combobox"))
    await user.click(await screen.findByRole("option", { name: "Todos" }))

    expect(submittedValue(container)).toBeUndefined()
  })

  it("is reachable through its label", () => {
    render(
      <form>
        <label htmlFor="weekday">Dia da semana</label>
        <SelectFilter id="weekday" name="weekday" options={WEEKDAYS} />
      </form>
    )

    expect(screen.getByLabelText("Dia da semana")).toBeInTheDocument()
  })
})
