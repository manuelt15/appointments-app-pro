import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { ApiKey } from '@/lib/mongodb/models/ApiKey'
import { resolveAuth } from './auth'

vi.mock('@/lib/mongodb/client', () => ({ connectDB: vi.fn(async () => undefined) }))
vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/mongodb/models/ApiKey', () => ({
  ApiKey: { findOne: vi.fn(), updateOne: vi.fn() },
}))

const MINUTE_MS = 60 * 1000

const request = () => new NextRequest('http://localhost/api/shifts', {
  headers: { 'x-api-key': 'sk_test' },
})

const storedKey = (lastUsedAt?: Date) => {
  vi.mocked(ApiKey.findOne).mockResolvedValue({
    _id: 'key-1',
    businessId: 'b1',
    lastUsedAt,
    expiresAt: undefined,
  } as never)
}

describe('resolveAuth con API key', () => {
  beforeEach(() => {
    vi.mocked(ApiKey.findOne).mockReset()
    vi.mocked(ApiKey.updateOne).mockReset()
  })

  it('no escribe lastUsedAt si se uso hace menos de 5 minutos', async () => {
    storedKey(new Date(Date.now() - 2 * MINUTE_MS))

    const context = await resolveAuth(request())

    expect(context).toEqual({ businessId: 'b1', authType: 'api_key' })
    expect(ApiKey.updateOne).not.toHaveBeenCalled()
  })

  it('escribe lastUsedAt si el guardado tiene mas de 5 minutos', async () => {
    storedKey(new Date(Date.now() - 10 * MINUTE_MS))

    await resolveAuth(request())

    expect(ApiKey.updateOne).toHaveBeenCalledTimes(1)
    const [filter, update] = vi.mocked(ApiKey.updateOne).mock.calls[0]
    expect(filter).toEqual({ _id: 'key-1' })
    expect((update as { $set: { lastUsedAt: Date } }).$set.lastUsedAt).toBeInstanceOf(Date)
  })

  it('escribe lastUsedAt si la clave nunca se uso', async () => {
    storedKey(undefined)

    await resolveAuth(request())

    expect(ApiKey.updateOne).toHaveBeenCalledTimes(1)
  })

  it('rechaza una clave caducada sin escribir nada', async () => {
    vi.mocked(ApiKey.findOne).mockResolvedValue({
      _id: 'key-1',
      businessId: 'b1',
      lastUsedAt: new Date(Date.now() - 10 * MINUTE_MS),
      expiresAt: new Date(Date.now() - MINUTE_MS),
    } as never)

    const context = await resolveAuth(request())

    expect(context).toBeNull()
    expect(ApiKey.updateOne).not.toHaveBeenCalled()
  })
})
