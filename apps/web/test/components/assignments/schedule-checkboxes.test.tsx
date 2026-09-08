/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { Checkbox } from "@/components/ui/checkbox"
import { readNumberArray } from "@/lib/forms"

/**
 * The assignment form submits its schedules as a checkbox group. The shadcn
 * checkbox is a Radix button, not a native input, so this pins down that it
 * still reaches `FormData` under the given name and value.
 */
describe("Checkbox inside a form", () => {
  function renderGroup(defaults: number[] = []) {
    const onSubmit = jest.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
    })

    render(
      <form onSubmit={onSubmit} aria-label="grupo">
        {[1, 2, 3].map((id) => (
          <label key={id}>
            Horário {id}
            <Checkbox
              name="schedule_ids"
              value={String(id)}
              defaultChecked={defaults.includes(id)}
            />
          </label>
        ))}
        <button type="submit">Enviar</button>
      </form>
    )

    return onSubmit
  }

  function submitted(onSubmit: jest.Mock) {
    const form = onSubmit.mock.calls[0][0].target as HTMLFormElement

    return readNumberArray(new FormData(form), "schedule_ids")
  }

  it("submits nothing when no box is checked", async () => {
    const user = userEvent.setup()
    const onSubmit = renderGroup()

    await user.click(screen.getByRole("button", { name: "Enviar" }))

    expect(submitted(onSubmit)).toBeUndefined()
  })

  it("submits the value of a checked box", async () => {
    const user = userEvent.setup()
    const onSubmit = renderGroup()

    await user.click(screen.getByRole("checkbox", { name: /Horário 2/ }))
    await user.click(screen.getByRole("button", { name: "Enviar" }))

    expect(submitted(onSubmit)).toEqual([2])
  })

  it("submits every checked box", async () => {
    const user = userEvent.setup()
    const onSubmit = renderGroup()

    await user.click(screen.getByRole("checkbox", { name: /Horário 1/ }))
    await user.click(screen.getByRole("checkbox", { name: /Horário 3/ }))
    await user.click(screen.getByRole("button", { name: "Enviar" }))

    expect(submitted(onSubmit)).toEqual([1, 3])
  })

  it("keeps the boxes that were already checked", async () => {
    const user = userEvent.setup()
    const onSubmit = renderGroup([2, 3])

    await user.click(screen.getByRole("button", { name: "Enviar" }))

    expect(submitted(onSubmit)).toEqual([2, 3])
  })

  it("drops a box the user unchecked", async () => {
    const user = userEvent.setup()
    const onSubmit = renderGroup([1, 2])

    await user.click(screen.getByRole("checkbox", { name: /Horário 1/ }))
    await user.click(screen.getByRole("button", { name: "Enviar" }))

    expect(submitted(onSubmit)).toEqual([2])
  })
})
