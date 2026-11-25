import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const deleteMany = vi.fn()
const toArray = vi.fn()
const countDocuments = vi.fn()
const deleteOne = vi.fn()

vi.mock('@/lib/mongodb/client', () => ({
  connectDB: async () => {},
  clientPromise: Promise.resolve({
    db: () => ({
      collection: (name: string) =>
        name === 'shifts'
          ? { deleteMany, countDocuments }
          : { find: () => ({ toArray }), deleteOne },
    }),
  }),
}))

const { GET } = await import('./route')

const request = (authorization?: string) =>
  new NextRequest('http://localhost/api/cron/retention', {
    headers: authorization ? { authorization } : {},
  })

const employee = (id: string) => ({ _id: { toString: () => id } })

describe('GET /api/cron/retention', () => {
  beforeEach(() => {
    deleteMany.mockReset()
    toArray.mockReset()
    countDocuments.mockReset()
    deleteOne.mockReset()
    deleteMany.mockResolvedValue({ deletedCount: 3 })
    toArray.mockResolvedValue([])
    vi.stubEnv('CRON_SECRET', 'secreto-de-prueba')
  })

  it('no deja borrar nada sin el secreto de Vercel Cron', async () => {
    const response = await GET(request())

    expect(response.status).toBe(401)
    expect(deleteMany).not.toHaveBeenCalled()
  })

  it('no hace nada si el secreto no esta configurado, en vez de quedar abierta', async () => {
    vi.stubEnv('CRON_SECRET', '')

    const response = await GET(request('Bearer '))

    expect(response.status).toBe(500)
    expect(deleteMany).not.toHaveBeenCalled()
  })

  it('borra los turnos caducados y las fichas anonimizadas que ya no tienen turnos', async () => {
    toArray.mockResolvedValue([employee('aaaabbbbccccddddeeeeffff'), employee('111122223333444455556666')])
    countDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(2)
    const response = await GET(request('Bearer secreto-de-prueba'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toMatchObject({ years: 4, deletedShifts: 3, deletedEmployees: 1 })
    expect(deleteOne).toHaveBeenCalledTimes(1)
  })

  it('respeta la ficha que aun conserva turnos dentro del plazo', async () => {
    toArray.mockResolvedValue([employee('111122223333444455556666')])
    countDocuments.mockResolvedValue(1)

    await GET(request('Bearer secreto-de-prueba'))

    expect(deleteOne).not.toHaveBeenCalled()
  })
})
