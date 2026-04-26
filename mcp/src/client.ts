import { config } from './config.js'

export async function apiCall(path: string, options: RequestInit = {}) {
  const url = `${config.apiUrl}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
      ...(options.headers as Record<string, string> ?? {}),
    },
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.error?.message ?? `API error: ${res.status}`)
  }

  return json.data
}
