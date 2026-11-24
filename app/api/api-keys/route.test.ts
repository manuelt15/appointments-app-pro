import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { ApiKey } from '@/lib/mongodb/models/ApiKey'
import { DELETE, POST } from './route'

vi.mock('@/lib/api/auth', () => ({ resolveAuth: vi.fn() }))
vi.mock('@/lib/mongodb/client', () => ({ connectDB: vi.fn(async () => undefined) }))
vi.mock('@/lib/mongodb/models/ApiKey', () => ({
  ApiKey: { create: vi.fn(), deleteMany: vi.fn() },
}))

const DAY_MS = 24 * 60 * 60 * 1000

const request = (body: Record<string, unknown> = { name: 'respaldo' }) =>
  new NextRequest('http://localhost/api/api-keys', {
    method: 'POST',
    body: JSON.stringify(body),
  })

const deleteRequest = (query = '') =>
  new NextRequest(`http://localhost/api/api-keys${query}`, { method: 'DELETE' })

const createdKey = () => {
  vi.mocked(ApiKey.create).mockResolvedValue({
    toObject: () => ({ businessId: 'b1', name: 'respaldo' }),
  } as never)
}

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

  it('caduca en 90 dias cuando el cliente no pide fecha', async () => {
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', userId: 'u1', authType: 'session' })
    createdKey()

    await POST(request())

    const { expiresAt } = vi.mocked(ApiKey.create).mock.calls[0][0] as { expiresAt: Date }
    expect(expiresAt).toBeInstanceOf(Date)
    expect(Math.round((expiresAt.getTime() - Date.now()) / DAY_MS)).toBe(90)
  })

  it('respeta una caducidad explicita dentro del maximo', async () => {
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', userId: 'u1', authType: 'session' })
    createdKey()
    const expiresAt = new Date(Date.now() + 10 * DAY_MS).toISOString()

    const response = await POST(request({ name: 'respaldo', expiresAt }))

    expect(response.status).toBe(201)
    const stored = vi.mocked(ApiKey.create).mock.calls[0][0] as { expiresAt: Date }
    expect(stored.expiresAt.toISOString()).toBe(expiresAt)
  })

  it('rechaza una caducidad de mas de 365 dias', async () => {
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', userId: 'u1', authType: 'session' })
    const expiresAt = new Date(Date.now() + 400 * DAY_MS).toISOString()

    const response = await POST(request({ name: 'respaldo', expiresAt }))

    expect(response.status).toBe(400)
    expect(ApiKey.create).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/api-keys?all=1', () => {
  beforeEach(() => {
    vi.mocked(resolveAuth).mockReset()
    vi.mocked(ApiKey.deleteMany).mockReset()
  })

  it('revoca todas las claves del negocio que llama', async () => {
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', userId: 'u1', authType: 'session' })
    vi.mocked(ApiKey.deleteMany).mockResolvedValue({ deletedCount: 3 } as never)

    const response = await DELETE(deleteRequest('?all=1'))

    expect(response.status).toBe(200)
    expect(ApiKey.deleteMany).toHaveBeenCalledWith({ businessId: 'b1' })
    expect(await response.json()).toMatchObject({ success: true, data: { deleted: 3 } })
  })

  it('una clave API no puede revocar claves', async () => {
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', authType: 'api_key' })

    const response = await DELETE(deleteRequest('?all=1'))

    expect(response.status).toBe(403)
    expect(ApiKey.deleteMany).not.toHaveBeenCalled()
  })

  it('sin all=1 no borra nada', async () => {
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', userId: 'u1', authType: 'session' })

    const response = await DELETE(deleteRequest())

    expect(response.status).toBe(400)
    expect(ApiKey.deleteMany).not.toHaveBeenCalled()
  })
})
