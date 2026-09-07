/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen, within } from "@testing-library/react"

import { TimetableGrid } from "@/components/assignments/timetable-grid"
import type { Timetable } from "@/lib/timetable"

function timetable(overrides: Partial<Timetable> = {}): Timetable {
  return {
    slots: ["07:30 - 09:10"],
    grid: {
      Monday: {
        "07:30 - 09:10": [
          {
            subject: "Banco de Dados",
            teacher: "Ana Souza",
            space: "Lab 1",
            violatesAvailability: false,
          },
        ],
      },
      Tuesday: { "07:30 - 09:10": [] },
      Wednesday: { "07:30 - 09:10": [] },
      Thursday: { "07:30 - 09:10": [] },
      Friday: { "07:30 - 09:10": [] },
      Saturday: { "07:30 - 09:10": [] },
    },
    ...overrides,
  }
}

describe("TimetableGrid", () => {
  it("renders one column per printed weekday plus the time column", () => {
    render(<TimetableGrid timetable={timetable()} />)

    const headers = screen.getAllByRole("columnheader")
    expect(headers.map((header) => header.textContent)).toEqual([
      "Horário",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ])
  })

  it("renders one row per time slot", () => {
    render(
      <TimetableGrid
        timetable={timetable({
          slots: ["07:30 - 09:10", "10:00 - 11:40"],
          grid: {
            Monday: { "07:30 - 09:10": [], "10:00 - 11:40": [] },
            Tuesday: { "07:30 - 09:10": [], "10:00 - 11:40": [] },
            Wednesday: { "07:30 - 09:10": [], "10:00 - 11:40": [] },
            Thursday: { "07:30 - 09:10": [], "10:00 - 11:40": [] },
            Friday: { "07:30 - 09:10": [], "10:00 - 11:40": [] },
            Saturday: { "07:30 - 09:10": [], "10:00 - 11:40": [] },
          },
        })}
      />,
    )

    expect(screen.getByRole("rowheader", { name: "07:30 - 09:10" }))
      .toBeInTheDocument()
    expect(screen.getByRole("rowheader", { name: "10:00 - 11:40" }))
      .toBeInTheDocument()
  })

  it("shows the class details in the matching cell", () => {
    render(<TimetableGrid timetable={timetable()} />)

    expect(screen.getByText("Banco de Dados")).toBeInTheDocument()
    expect(screen.getByText("Ana Souza")).toBeInTheDocument()
    expect(screen.getByText("Lab 1")).toBeInTheDocument()
  })

  it("flags a class that violates the teacher availability", () => {
    render(
      <TimetableGrid
        timetable={timetable({
          grid: {
            ...timetable().grid,
            Monday: {
              "07:30 - 09:10": [
                {
                  subject: "Redes",
                  teacher: "Ana",
                  space: "Lab 2",
                  violatesAvailability: true,
                },
              ],
            },
          },
        })}
      />,
    )

    expect(screen.getByText("Viola disponibilidade")).toBeInTheDocument()
  })

  it("does not flag a compliant class", () => {
    render(<TimetableGrid timetable={timetable()} />)

    expect(screen.queryByText("Viola disponibilidade")).toBeNull()
  })

  it("stacks the classes that share a cell", () => {
    const { container } = render(
      <TimetableGrid
        timetable={timetable({
          grid: {
            ...timetable().grid,
            Monday: {
              "07:30 - 09:10": [
                {
                  subject: "Banco de Dados",
                  teacher: "Ana",
                  space: "Lab 1",
                  violatesAvailability: false,
                },
                {
                  subject: "Redes",
                  teacher: "Bruno",
                  space: "Lab 2",
                  violatesAvailability: false,
                },
              ],
            },
          },
        })}
      />,
    )

    const cell = container.querySelectorAll("tbody td")[0] as HTMLElement
    expect(within(cell).getByText("Banco de Dados")).toBeInTheDocument()
    expect(within(cell).getByText("Redes")).toBeInTheDocument()
  })

  it("shows an empty state instead of a bare grid", () => {
    render(<TimetableGrid timetable={{ slots: [], grid: {} }} />)

    expect(
      screen.getByText("Nenhuma alocação com horário definido para esta turma."),
    ).toBeInTheDocument()
    expect(screen.queryByRole("table")).toBeNull()
  })
})
