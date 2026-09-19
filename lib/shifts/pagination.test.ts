import { describe, expect, it, vi } from 'vitest'
import { collectPaginatedResults } from './pagination'

describe('shift pagination', () => {
  it('loads every page until it reaches the reported total', async () => {
    const items = Array.from({ length: 501 }, (_, index) => index)
    const loadPage = vi.fn(async (page: number) => ({
      data: items.slice((page - 1) * 200, page * 200),
      meta: { total: items.length, page, limit: 200 },
    }))

    const result = await collectPaginatedResults(loadPage)

    expect(result).toEqual(items)
    expect(loadPage).toHaveBeenCalledTimes(3)
  })

  it('stops if the API returns an empty page', async () => {
    const loadPage = vi.fn(async (page: number) => ({
      data: page === 1 ? [1] : [],
      meta: { total: 2, page, limit: 1 },
    }))

    await expect(collectPaginatedResults(loadPage)).resolves.toEqual([1])
    expect(loadPage).toHaveBeenCalledTimes(2)
  })
})
