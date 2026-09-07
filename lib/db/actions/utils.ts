import { and, eq, type Column, type SQL } from "drizzle-orm"

import { NotFoundError } from "../errors"

/**
 * Mirrors the legacy `buildWhere` helper, which dropped `undefined`, `null`
 * and empty-string filters before handing them to the ORM.
 */
export function filterEq(
  column: Column,
  value: unknown,
): SQL | undefined {
  if (value === undefined || value === null || value === "") return undefined

  return eq(column, value)
}

export function buildWhere(
  filters: Array<SQL | undefined>,
): SQL | undefined {
  const applied = filters.filter((filter): filter is SQL => filter !== undefined)

  if (applied.length === 0) return undefined

  return and(...applied)
}

export function requireFound<T>(row: T | undefined | null, message: string): T {
  if (row === undefined || row === null) throw new NotFoundError(message)

  return row
}

/**
 * Keeps only the keys that were explicitly provided, reproducing the
 * `if (dto.field !== undefined)` blocks of the legacy services.
 */
export function pickDefined<T extends Record<string, unknown>>(
  input: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

export function hasUpdates(data: Record<string, unknown>): boolean {
  return Object.keys(data).length > 0
}
