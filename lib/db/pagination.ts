export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  content: T[]
  pagination: PaginationMeta
}

export interface PaginationInput {
  page: number
  limit: number
}

/** Mirrors the `offset` getter of the legacy `BaseQueryDto`. */
export function calculateOffset({ page, limit }: PaginationInput): number {
  return (page - 1) * limit
}

export function buildPaginationMeta(
  { page, limit }: PaginationInput,
  totalItems: number,
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / limit)

  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

export function paginate<T>(
  content: T[],
  pagination: PaginationInput,
  totalItems: number,
): PaginatedResponse<T> {
  return { content, pagination: buildPaginationMeta(pagination, totalItems) }
}
