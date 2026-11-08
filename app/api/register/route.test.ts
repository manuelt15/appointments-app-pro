import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

const users = vi.hoisted(() => ({ findOne: vi.fn(), insertOne: vi.fn() }))
vi.mock('@/lib/mongodb/client', () => ({
  clientPromise: Promise.resolve({ db: () => ({ collection: () => users }) }),
}))
vi.mock('@/lib/api/response', async () => import('../../../lib/api/response'))
import { POST } from './route'

const input = { name: 'Test User', email: 'user@example.test', password: 'test-password' }
const request = () => new NextRequest('http://localhost/api/register', {
  method: 'POST', body: JSON.stringify(input),
})

beforeEach(() => {
  vi.clearAllMocks()
  users.findOne.mockResolvedValue(null)
  users.insertOne.mockResolvedValue({ insertedId: { toString: () => 'new-user-id' } })
})

describe('registration privacy (appointments-2026-11-07-032)', () => {
  it('returns identical status, headers and body for existing and new emails', async () => {
    const created = await POST(request())
    users.findOne.mockResolvedValue({ email: input.email })
    const existing = await POST(request())
    expect(existing.status).toBe(created.status)
    expect([...existing.headers]).toEqual([...created.headers])
    expect(await existing.json()).toEqual(await created.json())
    expect(users.insertOne).toHaveBeenCalledTimes(1)
  })

  it('still creates the account with a hashed password without exposing its id', async () => {
    const response = await POST(request())
    expect(response.status).toBe(201)
    expect(users.findOne).toHaveBeenCalledWith({ email: input.email })
    const saved = users.insertOne.mock.calls[0][0]
    expect(saved).toMatchObject({ name: input.name, email: input.email, emailVerified: null })
    expect(saved.createdAt).toBeInstanceOf(Date)
    expect(await bcrypt.compare(input.password, saved.password)).toBe(true)
    expect(await response.text()).not.toContain('new-user-id')
  })
})
