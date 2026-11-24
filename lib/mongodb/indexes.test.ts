import { describe, expect, it, vi } from 'vitest'
import type { Db } from 'mongodb'
import {
  USERS_EMAIL_INDEX,
  buildDuplicateEmailsPipeline,
  describeDuplicates,
  ensureUserEmailIndex,
  isDuplicateKeyError,
} from './indexes'

interface FakeDbOptions {
  duplicates?: { email: string; count: number }[]
  indexes?: { name: string; key: Record<string, unknown>; unique?: boolean }[]
  createIndexError?: unknown
}

function fakeDb({ duplicates = [], indexes = [], createIndexError }: FakeDbOptions = {}) {
  const createIndex = vi.fn(async () => {
    if (createIndexError) throw createIndexError
    return USERS_EMAIL_INDEX
  })
  const db = {
    collection: () => ({
      aggregate: () => ({ toArray: async () => duplicates }),
      indexes: async () => indexes,
      createIndex,
    }),
  } as unknown as Db
  return { db, createIndex }
}

describe('duplicate email detection', () => {
  it('groups by exact email and drops the groups of one', () => {
    const pipeline = buildDuplicateEmailsPipeline()

    expect(pipeline[0]).toEqual({ $match: { email: { $type: 'string' } } })
    expect(pipeline[1]).toEqual({ $group: { _id: '$email', count: { $sum: 1 } } })
    expect(pipeline[2]).toEqual({ $match: { count: { $gt: 1 } } })
  })

  it('caps the sample so a dirty database cannot flood the log', () => {
    const pipeline = buildDuplicateEmailsPipeline(5)

    expect(pipeline).toContainEqual({ $limit: 5 })
  })

  it('names the addresses and how many times each one repeats', () => {
    const message = describeDuplicates([
      { email: 'ana@example.com', count: 3 },
      { email: 'bea@example.com', count: 2 },
    ])

    expect(message).toBe('2 email(s) repeated in users: ana@example.com x3, bea@example.com x2')
  })

  it('truncates the list but still says how many are left', () => {
    const many = Array.from({ length: 8 }, (_, index) => ({
      email: `a${index}@example.com`,
      count: 2,
    }))

    expect(describeDuplicates(many)).toContain('and 3 more')
  })
})

describe('ensureUserEmailIndex', () => {
  it('creates the same partial unique index every time it is called', async () => {
    const { db, createIndex } = fakeDb()

    const result = await ensureUserEmailIndex(db)

    expect(result).toEqual({ ok: true, created: true })
    expect(createIndex).toHaveBeenCalledWith(
      { email: 1 },
      {
        name: USERS_EMAIL_INDEX,
        unique: true,
        partialFilterExpression: { email: { $type: 'string' } },
      }
    )
  })

  it('reports created: false when the index is already there (idempotent)', async () => {
    const { db, createIndex } = fakeDb({
      indexes: [{ name: USERS_EMAIL_INDEX, key: { email: 1 }, unique: true }],
    })

    const result = await ensureUserEmailIndex(db)

    expect(result).toEqual({ ok: true, created: false })
    expect(createIndex).not.toHaveBeenCalled()
  })

  it('does not build it when emails are already duplicated, and it does not throw', async () => {
    const duplicates = [{ email: 'ana@example.com', count: 2 }]
    const { db, createIndex } = fakeDb({ duplicates })

    const result = await ensureUserEmailIndex(db)

    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'duplicates') throw new Error('expected duplicates')
    expect(result.message).toContain('ana@example.com x2')
    expect(result.message).toContain('not created')
    expect(result.duplicates).toEqual(duplicates)
    expect(createIndex).not.toHaveBeenCalled()
  })

  it('turns a duplicate key raised by the build into the same verdict, not a crash', async () => {
    const { db } = fakeDb({
      duplicates: [{ email: 'bea@example.com', count: 2 }],
      createIndexError: Object.assign(new Error('E11000 duplicate key error'), { code: 11000 }),
    })

    const result = await ensureUserEmailIndex(db)

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('duplicates')
  })

  it('reports any other failure as an error and keeps the app able to boot', async () => {
    const { db } = fakeDb({
      createIndexError: Object.assign(new Error('not authorized on users'), { code: 13 }),
    })

    const result = await ensureUserEmailIndex(db)

    expect(result).toEqual({ ok: false, reason: 'error', message: 'not authorized on users' })
  })

  it('refuses to reuse the name with different options', async () => {
    const { db, createIndex } = fakeDb({
      indexes: [{ name: USERS_EMAIL_INDEX, key: { email: 1 }, unique: false }],
    })

    const result = await ensureUserEmailIndex(db)

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.reason).toBe('error')
    expect(createIndex).not.toHaveBeenCalled()
  })
})

describe('isDuplicateKeyError', () => {
  it('recognises the duplicate key code', () => {
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true)
  })

  it('does not mistake other errors for a duplicate', () => {
    expect(isDuplicateKeyError({ code: 13 })).toBe(false)
    expect(isDuplicateKeyError(new Error('E11000 duplicate key error'))).toBe(false)
    expect(isDuplicateKeyError(null)).toBe(false)
    expect(isDuplicateKeyError(undefined)).toBe(false)
    expect(isDuplicateKeyError('11000')).toBe(false)
  })
})
