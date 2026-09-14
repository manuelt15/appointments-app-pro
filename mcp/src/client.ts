import { config } from './config.js'

interface ApiEnvelope<T> {
  data: T
  meta?: {
    total: number
    page: number
    limit: number
  }
  error?: string | { message?: string }
}

async function request<T>(path: string, options: RequestInit = {}) {
  const url = `${config.apiUrl}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
      ...(options.headers as Record<string, string> ?? {}),
    },
  })

  const json = await res.json() as ApiEnvelope<T>

  if (!res.ok) {
    const message = typeof json.error === 'string' ? json.error : json.error?.message
    throw new Error(message ?? `API error: ${res.status}`)
  }

  return json
}

export async function apiCall<T = unknown>(path: string, options: RequestInit = {}) {
  return (await request<T>(path, options)).data
}

export async function apiCallWithMeta<T>(path: string, options: RequestInit = {}) {
  const response = await request<T>(path, options)
  if (!response.meta) throw new Error('Paginated API response is missing metadata')
  return { data: response.data, meta: response.meta }
}
