import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PRIVACY_NOTICE_VERSION } from '@/lib/legal/privacy'
import { POST } from './route'

const findOne = vi.fn()
const insertOne = vi.fn()

vi.mock('@/lib/mongodb/client', () => ({
  clientPromise: Promise.resolve({ db: () => ({ collection: () => ({ findOne, insertOne }) }) }),
}))

const request = () =>
  new NextRequest('http://localhost/api/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Ana', email: 'ana@example.com', password: 'contrasena-larga' }),
  })

describe('POST /api/register', () => {
  beforeEach(() => {
    findOne.mockReset()
    insertOne.mockReset()
    insertOne.mockResolvedValue({ insertedId: 'u-new' })
  })

  it('crea la cuenta cuando el correo es nuevo', async () => {
    findOne.mockResolvedValue(null)

    const response = await POST(request())

    expect(response.status).toBe(201)
    expect(insertOne).toHaveBeenCalledTimes(1)
    expect(insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        privacyAcceptedAt: expect.any(Date),
        privacyVersion: PRIVACY_NOTICE_VERSION,
      }),
    )
  })

  it('responde igual si el correo ya existe, sin crear nada', async () => {
    findOne.mockResolvedValue({ _id: 'u-existing', email: 'ana@example.com' })

    const existing = await POST(request())

    findOne.mockResolvedValue(null)
    const fresh = await POST(request())

    expect(existing.status).toBe(201)
    expect(existing.status).toBe(fresh.status)
    expect(await existing.json()).toEqual(await fresh.json())
    expect(insertOne).toHaveBeenCalledTimes(1)
  })

  it('responde igual si dos registros chocan en el indice unico', async () => {
    findOne.mockResolvedValue(null)
    insertOne.mockRejectedValue({ code: 11000 })

    const response = await POST(request())

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ success: true, data: { ok: true } })
  })
})
