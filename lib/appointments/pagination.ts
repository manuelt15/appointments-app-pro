interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

export async function collectPaginatedResults<T>(
  loadPage: (page: number) => Promise<PaginatedResponse<T>>
) {
  const results: T[] = []
  let page = 1
  let total = 0

  do {
    const response = await loadPage(page)
    total = response.meta.total
    results.push(...response.data)

    if (response.data.length === 0) break
    page += 1
  } while (results.length < total)

  return results
}
