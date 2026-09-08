/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen } from "@testing-library/react"

import { Truncated } from "@/components/shared/truncated"

describe("Truncated", () => {
  it("shows the value", () => {
    render(<Truncated>Técnico em Enfermagem</Truncated>)

    expect(screen.getByText("Técnico em Enfermagem")).toBeInTheDocument()
  })

  it("keeps the full value reachable on hover", () => {
    const long = "TECNICO EM ENFERMAGEM - CURSO REGULAR - MOD/Serie I - 02/2025"

    render(<Truncated>{long}</Truncated>)

    expect(screen.getByText(long)).toHaveAttribute("title", long)
  })

  it("clips the text instead of stretching the table", () => {
    render(<Truncated>Alguma coisa</Truncated>)

    const element = screen.getByText("Alguma coisa")
    expect(element).toHaveClass("truncate")
    expect(element).toHaveClass("block")
  })

  it("falls back to a dash when there is no value", () => {
    render(<Truncated>{null}</Truncated>)

    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("treats blank text as no value", () => {
    render(<Truncated>{"   "}</Truncated>)

    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("does not put a title on the placeholder", () => {
    render(<Truncated>{undefined}</Truncated>)

    expect(screen.getByText("—")).not.toHaveAttribute("title")
  })

  it("accepts a width from the caller", () => {
    render(<Truncated className="max-w-24">Alguma coisa</Truncated>)

    expect(screen.getByText("Alguma coisa")).toHaveClass("max-w-24")
  })

  it("has a default width, so a caller cannot forget one", () => {
    render(<Truncated>Alguma coisa</Truncated>)

    expect(screen.getByText("Alguma coisa").className).toMatch(/max-w-/)
  })
})
