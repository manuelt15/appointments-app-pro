import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { ApiKey } from '@/lib/mongodb/models/ApiKey'
import { DELETE } from './route'

vi.mock('@/lib/api/auth', () => ({ resolveAuth: vi.fn() }))
vi.mock('@/lib/mongodb/client', () => ({ connectDB: vi.fn(async () => undefined) }))
vi.mock('@/lib/mongodb/models/ApiKey', () => ({ ApiKey: { findOneAndDelete: vi.fn() } }))

const request = () => new NextRequest('http://localhost/api/api-keys/key-1', { method: 'DELETE' })

const context = (id: string) => ({ params: Promise.resolve({ id }) }) as never

describe('DELETE /api/api-keys/[id]', () => {
  beforeEach(() => {
    vi.mocked(resolveAuth).mockReset()
    vi.mocked(ApiKey.findOneAndDelete).mockReset()
  })

  it('borra solo dentro del negocio que llama', async () => {
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', userId: 'u1', authType: 'session' })
    vi.mocked(ApiKey.findOneAndDelete).mockResolvedValue({ _id: 'key-1' } as never)

    const response = await DELETE(request(), context('key-1'))

    expect(response.status).toBe(200)
    expect(ApiKey.findOneAndDelete).toHaveBeenCalledWith({ _id: 'key-1', businessId: 'b1' })
  })

  it('devuelve 404 sin decir si la clave existe en otro negocio', async () => {
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', userId: 'u1', authType: 'session' })
    vi.mocked(ApiKey.findOneAndDelete).mockResolvedValue(null)

    const foreign = await DELETE(request(), context('key-of-b2'))

    // La clave es de otro negocio, asi que el filtro no la encuentra: misma
    // respuesta que para un id que no existe en ningun sitio.
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', userId: 'u1', authType: 'session' })
    const missing = await DELETE(request(), context('does-not-exist'))

    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(await foreign.json()).toEqual(await missing.json())
  })

  it('una clave API no puede revocar claves', async () => {
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', authType: 'api_key' })

    const response = await DELETE(request(), context('key-1'))

    expect(response.status).toBe(403)
    expect(ApiKey.findOneAndDelete).not.toHaveBeenCalled()
  })
})
