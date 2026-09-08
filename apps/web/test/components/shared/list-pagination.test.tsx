/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"

import { render, screen } from "@testing-library/react"

import { ListPagination } from "@/components/shared/list-pagination"
import type { PaginationMeta } from "@solara/db/pagination"

function meta(overrides: Partial<PaginationMeta> = {}): PaginationMeta {
  return {
    currentPage: 2,
    totalPages: 3,
    totalItems: 25,
    itemsPerPage: 10,
    hasNextPage: true,
    hasPrevPage: true,
    ...overrides,
  }
}

describe("ListPagination", () => {
  it("summarises the visible range", () => {
    render(
      <ListPagination
        pathname="/shifts"
        searchParams={{}}
        pagination={meta()}
        label="turnos"
      />
    )

    expect(screen.getByText("Mostrando 11–20 de 25 turnos")).toBeInTheDocument()
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument()
  })

  it("clamps the last page to the total", () => {
    render(
      <ListPagination
        pathname="/shifts"
        searchParams={{}}
        pagination={meta({ currentPage: 3, hasNextPage: false })}
      />
    )

    expect(screen.getByText("Mostrando 21–25 de 25 itens")).toBeInTheDocument()
  })

  it("links to the neighbouring pages keeping the filters", () => {
    render(
      <ListPagination
        pathname="/shifts"
        searchParams={{ name: "Matutino" }}
        pagination={meta()}
      />
    )

    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute(
      "href",
      "/shifts?name=Matutino&page=1"
    )
    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute(
      "href",
      "/shifts?name=Matutino&page=3"
    )
  })

  it("does not link past the first page", () => {
    render(
      <ListPagination
        pathname="/shifts"
        searchParams={{}}
        pagination={meta({ currentPage: 1, hasPrevPage: false })}
      />
    )

    expect(screen.queryByRole("link", { name: "Anterior" })).toBeNull()
    expect(screen.getByRole("link", { name: "Próxima" })).toBeInTheDocument()
  })

  it("does not link past the last page", () => {
    render(
      <ListPagination
        pathname="/shifts"
        searchParams={{}}
        pagination={meta({ currentPage: 3, hasNextPage: false })}
      />
    )

    expect(screen.queryByRole("link", { name: "Próxima" })).toBeNull()
  })

  it("renders nothing when there are no results", () => {
    const { container } = render(
      <ListPagination
        pathname="/shifts"
        searchParams={{}}
        pagination={meta({
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          hasNextPage: false,
          hasPrevPage: false,
        })}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
