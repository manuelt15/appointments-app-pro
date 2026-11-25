import { describe, it, expect, beforeEach, vi } from 'vitest'
import bcrypt from 'bcryptjs'

const findOne = vi.fn()

vi.mock('@/lib/mongodb/client', () => ({
  connectDB: async () => {},
  clientPromise: Promise.resolve({ db: () => ({ collection: () => ({ findOne }) }) }),
}))

const { authorizeWithPassword } = await import('./credentials')

const HASH = bcrypt.hashSync('contrasena-larga', 4)

const user = (email: string) => ({
  _id: { toString: () => 'u-1' },
  email,
  name: 'Ana',
  image: null,
  password: HASH,
})

describe('authorizeWithPassword', () => {
  beforeEach(() => {
    findOne.mockReset()
  })

  it('busca el correo normalizado y con collation, no tal cual se escribe', async () => {
    findOne.mockResolvedValue(user('ana@example.com'))

    await authorizeWithPassword({ email: 'Ana@Example.COM', password: 'contrasena-larga' })

    expect(findOne).toHaveBeenCalledWith(
      { email: 'ana@example.com' },
      { collation: { locale: 'es', strength: 2 } },
    )
  })

  it('deja entrar a una cuenta antigua guardada con mayusculas', async () => {
    findOne.mockResolvedValue(user('Ana@Example.COM'))

    const result = await authorizeWithPassword({
      email: 'ana@example.com',
      password: 'contrasena-larga',
    })

    expect(result).toMatchObject({ id: 'u-1', email: 'Ana@Example.COM' })
  })

  it('no devuelve nada con la contrasena equivocada', async () => {
    findOne.mockResolvedValue(user('ana@example.com'))

    expect(
      await authorizeWithPassword({ email: 'ana@example.com', password: 'otra-cosa-larga' }),
    ).toBeNull()
  })

  it('no devuelve nada si el correo no tiene forma de correo', async () => {
    expect(await authorizeWithPassword({ email: 'no-es-un-correo', password: 'x' })).toBeNull()
    expect(findOne).not.toHaveBeenCalled()
  })
})
