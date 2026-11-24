import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { MongoClient, type Db } from 'mongodb'
import { USERS_EMAIL_INDEX, ensureUserEmailIndex, isDuplicateKeyError } from './indexes'

// Runs only when pointed at a throwaway database, and the name has to say so:
// this suite drops the database it works in. `npm test` skips all of it.
//
//   MONGODB_TEST_URI=mongodb://127.0.0.1:27017/appointments_probe \
//     npx vitest run lib/mongodb/indexes.integration.test.ts
const uri = process.env.MONGODB_TEST_URI
const baseName = uri ? new URL(uri).pathname.replace(/^\//, '') : ''
const isThrowaway = /(probe|test)/i.test(baseName)
const suite = uri && isThrowaway ? describe : describe.skip

let client: MongoClient
let db: Db

suite('users.email unique index on a real database', () => {
  beforeAll(async () => {
    client = new MongoClient(uri!)
    await client.connect()
    db = client.db(`${baseName}-indexes`)
  })

  beforeEach(async () => {
    await db.collection('users').drop().catch(() => {})
  })

  afterAll(async () => {
    await db?.dropDatabase()
    await client?.close()
  })

  it('builds the index on the first call and reports it already there on the second', async () => {
    await db.collection('users').insertOne({ email: 'ana@example.com' })

    const first = await ensureUserEmailIndex(db)
    const second = await ensureUserEmailIndex(db)

    expect(first).toEqual({ ok: true, created: true })
    expect(second).toEqual({ ok: true, created: false })

    const index = (await db.collection('users').indexes()).find(
      (candidate) => candidate.name === USERS_EMAIL_INDEX
    )
    expect(index).toMatchObject({
      unique: true,
      key: { email: 1 },
      partialFilterExpression: { email: { $type: 'string' } },
    })
  })

  it('survives a database that already holds duplicate emails, and touches nothing', async () => {
    await db.collection('users').insertMany([
      { email: 'ana@example.com', name: 'Ana' },
      { email: 'ana@example.com', name: 'Ana again' },
      { email: 'bea@example.com', name: 'Bea' },
      { name: 'oauth user without email' },
      { name: 'another oauth user without email' },
    ])

    const result = await ensureUserEmailIndex(db)

    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'duplicates') throw new Error('expected duplicates')
    expect(result.duplicates).toEqual([{ email: 'ana@example.com', count: 2 }])
    expect(result.message).toContain('ana@example.com x2')

    const indexNames = (await db.collection('users').indexes()).map((candidate) => candidate.name)
    expect(indexNames).not.toContain(USERS_EMAIL_INDEX)
    expect(await db.collection('users').countDocuments()).toBe(5)
  })

  it('lets the index settle two concurrent sign-ups: one account, one duplicate key', async () => {
    await ensureUserEmailIndex(db)
    const users = db.collection('users')

    const attempts = await Promise.allSettled([
      users.insertOne({ email: 'ana@example.com', name: 'first' }),
      users.insertOne({ email: 'ana@example.com', name: 'second' }),
    ])

    expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1)
    const rejected = attempts.filter(
      (attempt): attempt is PromiseRejectedResult => attempt.status === 'rejected'
    )
    expect(rejected).toHaveLength(1)
    expect(isDuplicateKeyError(rejected[0].reason)).toBe(true)
    expect(await users.countDocuments({ email: 'ana@example.com' })).toBe(1)
  })

  it('does not block users without an email: the index is partial', async () => {
    await ensureUserEmailIndex(db)

    await db.collection('users').insertMany([
      { name: 'oauth user without email' },
      { name: 'another oauth user without email' },
      { email: null, name: 'null email' },
      { email: null, name: 'null email too' },
    ])

    expect(await db.collection('users').countDocuments()).toBe(4)
  })
})
