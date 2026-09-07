/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import {
  AvailabilityGrid,
  type AvailabilitySlot,
} from "@/components/availability/availability-grid"

const slots: AvailabilitySlot[] = [
  { id: 1, weekday: "Monday", start_time: "09:00", end_time: "10:40" },
  { id: 2, weekday: "Monday", start_time: "07:30", end_time: "09:00" },
  { id: 3, weekday: "Wednesday", start_time: "10:00", end_time: "11:40" },
]

function toggleFor() {
  return jest.fn().mockResolvedValue({ success: true })
}

describe("AvailabilityGrid", () => {
  it("groups the slots under their weekday", () => {
    render(
      <AvailabilityGrid
        slots={slots}
        selectedScheduleIds={[]}
        onToggle={toggleFor()}
      />,
    )

    expect(screen.getByRole("heading", { name: "Segunda" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Quarta" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Terça" })).toBeNull()
  })

  it("orders the slots of a day by start time", () => {
    render(
      <AvailabilityGrid
        slots={slots}
        selectedScheduleIds={[]}
        onToggle={toggleFor()}
      />,
    )

    const buttons = screen.getAllByRole("button")
    expect(buttons[0]).toHaveAccessibleName("Segunda 07:30 às 09:00")
    expect(buttons[1]).toHaveAccessibleName("Segunda 09:00 às 10:40")
  })

  it("marks the already declared slots as pressed", () => {
    render(
      <AvailabilityGrid
        slots={slots}
        selectedScheduleIds={[3]}
        onToggle={toggleFor()}
      />,
    )

    expect(
      screen.getByRole("button", { name: "Quarta 10:00 às 11:40" }),
    ).toHaveAttribute("aria-pressed", "true")
    expect(
      screen.getByRole("button", { name: "Segunda 07:30 às 09:00" }),
    ).toHaveAttribute("aria-pressed", "false")
  })

  it("counts the selected slots", () => {
    render(
      <AvailabilityGrid
        slots={slots}
        selectedScheduleIds={[1, 3]}
        onToggle={toggleFor()}
      />,
    )

    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("asks the server to add an unselected slot", async () => {
    const onToggle = toggleFor()
    const user = userEvent.setup()
    render(
      <AvailabilityGrid
        slots={slots}
        selectedScheduleIds={[]}
        onToggle={onToggle}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Quarta 10:00 às 11:40" }),
    )

    expect(onToggle).toHaveBeenCalledWith(3, true)
  })

  it("asks the server to remove an already selected slot", async () => {
    const onToggle = toggleFor()
    const user = userEvent.setup()
    render(
      <AvailabilityGrid
        slots={slots}
        selectedScheduleIds={[3]}
        onToggle={onToggle}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Quarta 10:00 às 11:40" }),
    )

    expect(onToggle).toHaveBeenCalledWith(3, false)
  })

  it("reflects the click before the server answers", async () => {
    let resolve: (value: { success: boolean }) => void = () => {}
    const onToggle = jest.fn(
      () => new Promise<{ success: boolean }>((r) => (resolve = r)),
    )
    const user = userEvent.setup()
    render(
      <AvailabilityGrid
        slots={slots}
        selectedScheduleIds={[]}
        onToggle={onToggle}
      />,
    )

    const slot = screen.getByRole("button", { name: "Quarta 10:00 às 11:40" })
    await user.click(slot)

    // Still awaiting the server, but the UI already shows the new state.
    expect(slot).toHaveAttribute("aria-pressed", "true")

    resolve({ success: true })
  })

  it("renders an empty state when there is no schedule at all", () => {
    render(
      <AvailabilityGrid
        slots={[]}
        selectedScheduleIds={[]}
        onToggle={toggleFor()}
      />,
    )

    expect(screen.getByText("Nenhum horário cadastrado.")).toBeInTheDocument()
  })

  it("does not call the server in read-only mode", async () => {
    const onToggle = toggleFor()
    const user = userEvent.setup()
    render(
      <AvailabilityGrid
        slots={slots}
        selectedScheduleIds={[]}
        onToggle={onToggle}
        readOnly
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Quarta 10:00 às 11:40" }),
    )

    expect(onToggle).not.toHaveBeenCalled()
  })
})
