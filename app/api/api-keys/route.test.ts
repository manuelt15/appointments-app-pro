import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { ApiKey } from '@/lib/mongodb/models/ApiKey'
import { POST } from './route'

vi.mock('@/lib/api/auth', () => ({ resolveAuth: vi.fn() }))
vi.mock('@/lib/mongodb/client', () => ({ connectDB: vi.fn(async () => undefined) }))
vi.mock('@/lib/mongodb/models/ApiKey', () => ({ ApiKey: { create: vi.fn() } }))

const request = () =>
  new NextRequest('http://localhost/api/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name: 'respaldo' }),
  })

describe('POST /api/api-keys', () => {
  beforeEach(() => {
    vi.mocked(resolveAuth).mockReset()
    vi.mocked(ApiKey.create).mockReset()
  })

  it('rechaza una clave API: solo una sesion puede emitir credenciales', async () => {
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', authType: 'api_key' })

    const response = await POST(request())

    expect(response.status).toBe(403)
    expect(ApiKey.create).not.toHaveBeenCalled()
  })

  it('permite crear la clave desde una sesion', async () => {
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', userId: 'u1', authType: 'session' })
    vi.mocked(ApiKey.create).mockResolvedValue({
      toObject: () => ({ businessId: 'b1', name: 'respaldo' }),
    } as never)

    const response = await POST(request())

    expect(response.status).toBe(201)
    expect(ApiKey.create).toHaveBeenCalledTimes(1)
  })
})
