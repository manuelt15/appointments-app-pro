import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  resolveAuth: vi.fn(),
  create: vi.fn(),
  findOneAndDelete: vi.fn(),
}))
vi.mock('@/lib/api/auth', () => ({ resolveAuth: mocks.resolveAuth }))
vi.mock('@/lib/mongodb/client', () => ({ connectDB: vi.fn() }))
vi.mock('@/lib/mongodb/models/ApiKey', () => ({
  ApiKey: { create: mocks.create, findOneAndDelete: mocks.findOneAndDelete },
}))
vi.mock('@/lib/api/response', async () => import('../../../lib/api/response'))
import { POST } from './route'
import { DELETE } from './[id]/route'

const businessId = 'owner-business'
const request = () => new NextRequest('http://localhost/api/api-keys', {
  method: 'POST', body: JSON.stringify({ name: 'New key' }),
})
const context = { params: Promise.resolve({ id: 'key-id' }) }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.resolveAuth.mockResolvedValue({ businessId, authType: 'api_key' })
})

describe('owner-only API key management (appointments-2026-11-10-001)', () => {
  it('does not let a delegated key mint an independent credential', async () => {
    const response = await POST(request())
    expect(response.status).toBe(403)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('does not let a delegated key revoke owner credentials', async () => {
    const response = await DELETE(request(), context)
    expect(response.status).toBe(403)
    expect(mocks.findOneAndDelete).not.toHaveBeenCalled()
  })

  it('still allows the owner session to create a key bound to its business', async () => {
    mocks.resolveAuth.mockResolvedValue({ businessId, userId: 'owner', authType: 'session' })
    mocks.create.mockResolvedValue({ toObject: () => ({ _id: 'new-key', businessId }) })
    const response = await POST(request())
    expect(response.status).toBe(201)
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ businessId, name: 'New key' }))
    const { data } = await response.json()
    expect(data.key).toMatch(/^sk_[a-f0-9]{64}$/)
  })

  it('still scopes owner revocation to the authenticated business', async () => {
    mocks.resolveAuth.mockResolvedValue({ businessId, userId: 'owner', authType: 'session' })
    mocks.findOneAndDelete.mockResolvedValue({ _id: 'key-id' })
    expect((await DELETE(request(), context)).status).toBe(200)
    expect(mocks.findOneAndDelete).toHaveBeenCalledWith({ _id: 'key-id', businessId })
  })

  it('continues to reject unauthenticated callers', async () => {
    mocks.resolveAuth.mockResolvedValue(null)
    expect((await POST(request())).status).toBe(401)
    expect((await DELETE(request(), context)).status).toBe(401)
  })
})
