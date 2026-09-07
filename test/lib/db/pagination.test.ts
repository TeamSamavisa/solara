import {
  buildPaginationMeta,
  calculateOffset,
  paginate,
} from "@/lib/db/pagination"

describe("calculateOffset", () => {
  it("returns 0 on the first page", () => {
    expect(calculateOffset({ page: 1, limit: 10 })).toBe(0)
  })

  it("skips the previous pages", () => {
    expect(calculateOffset({ page: 3, limit: 10 })).toBe(20)
    expect(calculateOffset({ page: 2, limit: 25 })).toBe(25)
  })
})

describe("buildPaginationMeta", () => {
  it("describes a page in the middle of the result set", () => {
    expect(buildPaginationMeta({ page: 2, limit: 10 }, 25)).toEqual({
      currentPage: 2,
      totalPages: 3,
      totalItems: 25,
      itemsPerPage: 10,
      hasNextPage: true,
      hasPrevPage: true,
    })
  })

  it("has no next page on the last page", () => {
    const meta = buildPaginationMeta({ page: 3, limit: 10 }, 25)
    expect(meta.totalPages).toBe(3)
    expect(meta.hasNextPage).toBe(false)
    expect(meta.hasPrevPage).toBe(true)
  })

  it("has no previous page on the first page", () => {
    const meta = buildPaginationMeta({ page: 1, limit: 10 }, 25)
    expect(meta.hasPrevPage).toBe(false)
    expect(meta.hasNextPage).toBe(true)
  })

  it("handles a total that is an exact multiple of the page size", () => {
    const meta = buildPaginationMeta({ page: 2, limit: 10 }, 20)
    expect(meta.totalPages).toBe(2)
    expect(meta.hasNextPage).toBe(false)
  })

  it("handles an empty result set", () => {
    expect(buildPaginationMeta({ page: 1, limit: 10 }, 0)).toEqual({
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPrevPage: false,
    })
  })

  it("reports no next page when the requested page is past the end", () => {
    const meta = buildPaginationMeta({ page: 9, limit: 10 }, 25)
    expect(meta.totalPages).toBe(3)
    expect(meta.hasNextPage).toBe(false)
    expect(meta.hasPrevPage).toBe(true)
  })

  it("handles a single item spread over a large page size", () => {
    const meta = buildPaginationMeta({ page: 1, limit: 100 }, 1)
    expect(meta.totalPages).toBe(1)
    expect(meta.hasNextPage).toBe(false)
    expect(meta.hasPrevPage).toBe(false)
  })
})

describe("paginate", () => {
  it("wraps the rows together with the metadata", () => {
    const rows = [{ id: 1 }, { id: 2 }]

    expect(paginate(rows, { page: 1, limit: 2 }, 4)).toEqual({
      content: rows,
      pagination: {
        currentPage: 1,
        totalPages: 2,
        totalItems: 4,
        itemsPerPage: 2,
        hasNextPage: true,
        hasPrevPage: false,
      },
    })
  })
})
