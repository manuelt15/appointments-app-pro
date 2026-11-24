import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PRIVACY_CONSENT_COOKIE, PRIVACY_NOTICE_VERSION } from './privacy'
import { createUserEvent } from './oauth-consent'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  deleteCookie: vi.fn(),
  updateOne: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.get, delete: mocks.deleteCookie }),
}))

vi.mock('@/lib/mongodb/client', () => ({
  clientPromise: Promise.resolve({
    db: () => ({ collection: () => ({ updateOne: mocks.updateOne }) }),
  }),
}))

const userId = new ObjectId().toHexString()

describe('events.createUser', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.deleteCookie.mockReset()
    mocks.updateOne.mockReset()
    mocks.updateOne.mockResolvedValue({ matchedCount: 1 })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('guarda la fecha y la version cuando el usuario acepto el aviso', async () => {
    mocks.get.mockReturnValue({ name: PRIVACY_CONSENT_COOKIE, value: '1' })

    await createUserEvent({ user: { id: userId, email: 'ana@example.com' } })

    expect(mocks.get).toHaveBeenCalledWith(PRIVACY_CONSENT_COOKIE)
    expect(mocks.updateOne).toHaveBeenCalledTimes(1)
    const [filter, update] = mocks.updateOne.mock.calls[0]
    expect(filter._id.toString()).toBe(userId)
    expect(update.$set).toEqual({
      privacyAcceptedAt: expect.any(Date),
      privacyVersion: PRIVACY_NOTICE_VERSION,
    })
    expect(mocks.deleteCookie).toHaveBeenCalledWith(PRIVACY_CONSENT_COOKIE)
  })

  it('no toca la cuenta ni inventa campos cuando no hay cookie de consentimiento', async () => {
    mocks.get.mockReturnValue(undefined)

    await createUserEvent({ user: { id: userId, email: 'ana@example.com' } })

    expect(mocks.updateOne).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('ana@example.com'))
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('privacy consent'))
  })

  it('no escribe si el adaptador no entrega id de usuario', async () => {
    mocks.get.mockReturnValue({ name: PRIVACY_CONSENT_COOKIE, value: '1' })

    await createUserEvent({ user: { email: 'ana@example.com' } })

    expect(mocks.updateOne).not.toHaveBeenCalled()
  })
})
