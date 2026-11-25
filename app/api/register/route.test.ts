import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { PRIVACY_NOTICE_VERSION } from '@/lib/legal/privacy'
import { POST } from './route'

const findOne = vi.fn()
const insertOne = vi.fn()

vi.mock('@/lib/mongodb/client', () => ({
  clientPromise: Promise.resolve({ db: () => ({ collection: () => ({ findOne, insertOne }) }) }),
}))

const request = (overrides: Record<string, unknown> = {}) =>
  new NextRequest('http://localhost/api/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'contrasena-larga',
      privacyAccepted: true,
      ...overrides,
    }),
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
    expect([...existing.headers]).toEqual([...fresh.headers])
    expect(await existing.json()).toEqual(await fresh.json())
    expect(insertOne).toHaveBeenCalledTimes(1)
  })

  it('guarda el password hasheado sin exponer el id (caso de main)', async () => {
    findOne.mockResolvedValue(null)

    const response = await POST(request())

    expect(response.status).toBe(201)
    expect(findOne).toHaveBeenCalledWith(
      { email: 'ana@example.com' },
      { collation: { locale: 'es', strength: 2 } },
    )
    const saved = insertOne.mock.calls[0][0]
    expect(saved).toMatchObject({ name: 'Ana', email: 'ana@example.com', emailVerified: null })
    expect(saved.createdAt).toBeInstanceOf(Date)
    expect(await bcrypt.compare('contrasena-larga', saved.password)).toBe(true)
    expect(await response.text()).not.toContain('u-new')
  })

  it('hashea tambien cuando el correo ya existe', async () => {
    findOne.mockResolvedValue({ _id: 'u-existing', email: 'ana@example.com' })
    const hash = vi.spyOn(bcrypt, 'hash')
    try {
      const response = await POST(request())
      expect(response.status).toBe(201)
      expect(hash).toHaveBeenCalledWith('contrasena-larga', 12)
      expect(insertOne).not.toHaveBeenCalled()
    } finally {
      hash.mockRestore()
    }
  })

  it('responde igual si dos registros chocan en el indice unico', async () => {
    findOne.mockResolvedValue(null)
    insertOne.mockRejectedValue({ code: 11000 })

    const response = await POST(request())

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ success: true, data: { ok: true } })
  })

  it('normaliza el correo a minusculas antes de buscar y de guardar', async () => {
    findOne.mockResolvedValue(null)

    const response = await POST(request({ email: 'Ana@Example.COM' }))

    expect(response.status).toBe(201)
    // La collation es lo que hace que una cuenta antigua en mayusculas se
    // encuentre al dar de alta la misma direccion en minusculas.
    expect(findOne).toHaveBeenCalledWith(
      { email: 'ana@example.com' },
      { collation: { locale: 'es', strength: 2 } },
    )
    expect(insertOne.mock.calls[0][0]).toMatchObject({ email: 'ana@example.com' })
  })

  it('encuentra una cuenta antigua guardada con mayusculas y no crea otra', async () => {
    findOne.mockResolvedValue({ _id: 'u-legacy', email: 'Ana@Example.COM' })

    const response = await POST(request({ email: 'ana@example.com' }))

    expect(response.status).toBe(201)
    expect(insertOne).not.toHaveBeenCalled()
  })

  it('no crea la cuenta si falta la aceptacion del aviso o no es true', async () => {
    findOne.mockResolvedValue(null)

    for (const privacyAccepted of [undefined, false, null]) {
      const response = await POST(request({ privacyAccepted }))

      expect(response.status, String(privacyAccepted)).toBe(400)
      expect(await response.json()).toMatchObject({
        success: false,
        error: 'Validation error',
      })
    }
    expect(insertOne).not.toHaveBeenCalled()
  })
})
