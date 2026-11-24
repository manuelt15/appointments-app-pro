import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PRIVACY_CONSENT_COOKIE, PRIVACY_NOTICE_VERSION } from './privacy'
import { PRIVACY_ACCEPT_PATH, createUserEvent, enforcePrivacyAtSignUp } from './oauth-consent'
import type { SignInParams } from './oauth-consent'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  deleteCookie: vi.fn(),
  updateOne: vi.fn(),
  findAccount: vi.fn(),
  findUser: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.get, delete: mocks.deleteCookie }),
}))

vi.mock('@/lib/mongodb/client', () => ({
  clientPromise: Promise.resolve({
    db: () => ({
      collection: (name: string) =>
        name === 'accounts'
          ? { findOne: mocks.findAccount }
          : { findOne: mocks.findUser, updateOne: mocks.updateOne },
    }),
  }),
}))

const userId = new ObjectId().toHexString()

const googleAccount = {
  provider: 'google',
  providerAccountId: 'google-sub-1',
  type: 'oauth' as const,
}

function signInParams(account: SignInParams['account'], email: string | null = 'ana@example.com'): SignInParams {
  return { user: { id: 'provider-sub-1', email, name: 'Ana', emailVerified: null }, account }
}

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

describe('callbacks.signIn', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.updateOne.mockReset()
    mocks.findAccount.mockReset()
    mocks.findUser.mockReset()
    mocks.findAccount.mockResolvedValue(null)
    mocks.findUser.mockResolvedValue(null)
  })

  it('manda a aceptar el aviso a una cuenta OAuth nueva sin cookie y no la deja crear negocio', async () => {
    mocks.get.mockReturnValue(undefined)

    const result = await enforcePrivacyAtSignUp(signInParams(googleAccount))

    // Sin sesion no hay area privada ni POST /api/business posible (ver
    // app/api/business/route.test.ts): la cuenta ni siquiera llega a crearse.
    expect(result).toBe(PRIVACY_ACCEPT_PATH)
    expect(mocks.findAccount).toHaveBeenCalledWith(
      { provider: 'google', providerAccountId: 'google-sub-1' },
      { projection: { _id: 1 } },
    )
    expect(mocks.updateOne).not.toHaveBeenCalled()
  })

  it('deja entrar siempre a una cuenta existente sin privacyAcceptedAt', async () => {
    mocks.get.mockReturnValue(undefined)
    mocks.findAccount.mockResolvedValue({ _id: new ObjectId() })

    const result = await enforcePrivacyAtSignUp(signInParams(googleAccount))

    expect(result).toBe(true)
    expect(mocks.updateOne).not.toHaveBeenCalled()
  })

  it('deja entrar a una cuenta anterior registrada solo por correo', async () => {
    mocks.get.mockReturnValue(undefined)
    mocks.findUser.mockResolvedValue({ _id: new ObjectId() })

    const result = await enforcePrivacyAtSignUp(signInParams(googleAccount))

    expect(result).toBe(true)
  })

  it('no toca el flujo de credenciales', async () => {
    const result = await enforcePrivacyAtSignUp(
      signInParams({ provider: 'credentials', providerAccountId: 'ana@example.com', type: 'credentials' }),
    )

    expect(result).toBe(true)
    expect(mocks.get).not.toHaveBeenCalled()
    expect(mocks.findAccount).not.toHaveBeenCalled()
  })

  it('tras aceptar, la cuenta nueva se crea y guarda privacyAcceptedAt y privacyVersion', async () => {
    mocks.get.mockReturnValue({ name: PRIVACY_CONSENT_COOKIE, value: '1' })
    mocks.updateOne.mockResolvedValue({ matchedCount: 1 })

    expect(await enforcePrivacyAtSignUp(signInParams(googleAccount))).toBe(true)
    await createUserEvent({ user: { id: userId, email: 'ana@example.com' } })

    expect(mocks.findAccount).not.toHaveBeenCalled()
    expect(mocks.findUser).not.toHaveBeenCalled()
    expect(mocks.updateOne).toHaveBeenCalledTimes(1)
    const [filter, update] = mocks.updateOne.mock.calls[0]
    expect(filter._id.toString()).toBe(userId)
    expect(update.$set).toEqual({
      privacyAcceptedAt: expect.any(Date),
      privacyVersion: PRIVACY_NOTICE_VERSION,
    })
  })
})
