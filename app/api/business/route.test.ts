import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/auth', () => ({ auth: vi.fn(async () => null) }))
vi.mock('@/lib/mongodb/client', () => ({ connectDB: vi.fn(async () => undefined) }))
vi.mock('@/lib/mongodb/models/Business', () => ({ Business: {} }))

import { POST } from './route'

describe('POST /api/business sin sesion', () => {
  it('no crea el negocio de un alta OAuth que aun no acepto el aviso (no tiene sesion)', async () => {
    const request = new NextRequest('http://localhost/api/business', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Peluqueria Ana', timezone: 'Europe/Madrid' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body).toEqual({ success: false, error: 'Unauthorized' })
  })
})
