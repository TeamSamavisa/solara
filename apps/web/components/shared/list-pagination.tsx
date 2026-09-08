import Link from "next/link"

import { Button } from "@/components/ui/button"
import type { PaginationMeta } from "@solara/db/pagination"
import { buildHref, type SearchParamsRecord } from "@/lib/search-params"

/**
 * Server-rendered pagination: plain links, so it works without JavaScript and
 * keeps the current filters in the URL.
 */
export function ListPagination({
  pathname,
  searchParams,
  pagination,
  label = "itens",
}: {
  pathname: string
  searchParams: SearchParamsRecord
  pagination: PaginationMeta
  label?: string
}) {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination

  if (totalItems === 0) return null

  const firstItem = (currentPage - 1) * itemsPerPage + 1
  const lastItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-col items-center justify-between gap-3 pt-4 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground">
        Mostrando {firstItem}–{lastItem} de {totalItems} {label}
      </p>

      <div className="flex items-center gap-2">
        <Button
          asChild={pagination.hasPrevPage}
          variant="outline"
          size="sm"
          disabled={!pagination.hasPrevPage}
        >
          {pagination.hasPrevPage ? (
            <Link
              href={buildHref(pathname, searchParams, {
                page: currentPage - 1,
              })}
              rel="prev"
            >
              Anterior
            </Link>
          ) : (
            <span>Anterior</span>
          )}
        </Button>

        <span className="text-sm" aria-current="page">
          Página {currentPage} de {totalPages}
        </span>

        <Button
          asChild={pagination.hasNextPage}
          variant="outline"
          size="sm"
          disabled={!pagination.hasNextPage}
        >
          {pagination.hasNextPage ? (
            <Link
              href={buildHref(pathname, searchParams, {
                page: currentPage + 1,
              })}
              rel="next"
            >
              Próxima
            </Link>
          ) : (
            <span>Próxima</span>
          )}
        </Button>
      </div>
    </nav>
  )
}
