export type SearchParamsRecord = Record<string, string | string[] | undefined>

/**
 * Builds a link that keeps the current filters and overrides only the given
 * keys. `undefined` (or an empty string) removes a key, so cleared filters do
 * not linger in the URL.
 */
export function buildHref(
  pathname: string,
  current: SearchParamsRecord,
  overrides: Record<string, string | number | undefined> = {},
): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(current)) {
    if (key in overrides) continue
    if (value === undefined) continue

    const first = Array.isArray(value) ? value[0] : value
    if (first === undefined || first === "") continue

    params.set(key, first)
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === "") continue

    params.set(key, String(value))
  }

  const query = params.toString()

  return query ? `${pathname}?${query}` : pathname
}

/** Reads a single search param, ignoring repeated occurrences. */
export function firstParam(
  params: SearchParamsRecord,
  key: string,
): string | undefined {
  const value = params[key]
  const first = Array.isArray(value) ? value[0] : value

  return first === "" ? undefined : first
}
