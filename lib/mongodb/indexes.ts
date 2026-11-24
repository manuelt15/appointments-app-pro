import type { Db, Document } from 'mongodb'

/**
 * Partial unique index on `users.email`.
 *
 * Partial (`email` must be a string) so the Auth.js adapter can keep inserting
 * accounts that arrive without an email: without the filter every such document
 * would collide on `null`.
 *
 * The name is fixed because the register route relies on the duplicate-key error
 * to settle two concurrent sign-ups, and this name identifies the constraint.
 */
export const USERS_EMAIL_INDEX = 'users_email_unique'

const EMAIL_KEY: Document = { email: 1 }
const EMAIL_IS_STRING: Document = { email: { $type: 'string' } }

const DUPLICATE_KEY = 11000

export interface DuplicateEmail {
  email: string
  count: number
}

export type UserEmailIndexResult =
  | { ok: true; created: boolean }
  | { ok: false; reason: 'duplicates'; message: string; duplicates: DuplicateEmail[] }
  | { ok: false; reason: 'error'; message: string }

/**
 * Groups `users` by exact email, the comparison the index itself makes (binary
 * string, no collation). The second `$match` drops the groups of one.
 */
export function buildDuplicateEmailsPipeline(limit = 20): Document[] {
  return [
    { $match: EMAIL_IS_STRING },
    { $group: { _id: '$email', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
    { $project: { _id: 0, email: '$_id', count: 1 } },
  ]
}

/** MongoDB's duplicate-key error, the one the unique index raises. */
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === DUPLICATE_KEY
  )
}

export function describeDuplicates(duplicates: DuplicateEmail[]): string {
  const sample = duplicates
    .slice(0, 5)
    .map(({ email, count }) => `${email} x${count}`)
    .join(', ')
  const rest = duplicates.length > 5 ? `, and ${duplicates.length - 5} more` : ''
  return `${duplicates.length} email(s) repeated in users: ${sample}${rest}`
}

export async function findDuplicateEmails(db: Db, limit = 20): Promise<DuplicateEmail[]> {
  const rows = await db
    .collection('users')
    .aggregate<DuplicateEmail>(buildDuplicateEmailsPipeline(limit))
    .toArray()
  return rows.map(({ email, count }) => ({ email, count }))
}

async function usersEmailIndexState(db: Db): Promise<'missing' | 'ready' | 'different'> {
  // `listIndexes` on a collection that does not exist yet returns an empty list.
  const indexes = await db
    .collection('users')
    .indexes()
    .catch(() => [])
  const current = indexes.find((index) => index.name === USERS_EMAIL_INDEX)
  if (!current || !current.key) return 'missing'

  const onlyEmail = Object.keys(current.key).length === 1 && current.key.email === 1
  return onlyEmail && current.unique === true ? 'ready' : 'different'
}

/**
 * Creates the unique index if it is not there yet. Safe to call on every boot:
 * `createIndex` with the same spec is a no-op and a second call reports
 * `created: false`, so running it twice changes nothing.
 *
 * It never throws. If the data already holds duplicate emails the index cannot
 * be built, and that is reported (`reason: 'duplicates'`) instead of taking the
 * app down: a dirty database still boots, the operator cleans the duplicates and
 * the next start builds the index.
 */
export async function ensureUserEmailIndex(db: Db): Promise<UserEmailIndexResult> {
  try {
    const state = await usersEmailIndexState(db)
    if (state === 'ready') return { ok: true, created: false }
    if (state === 'different') {
      return {
        ok: false,
        reason: 'error',
        message: `An index named ${USERS_EMAIL_INDEX} already exists with different options; it has to be dropped by hand before retrying.`,
      }
    }

    const duplicates = await findDuplicateEmails(db)
    if (duplicates.length > 0) {
      return {
        ok: false,
        reason: 'duplicates',
        message: `users.email unique index not created: ${describeDuplicates(duplicates)}. Nothing was changed and the app keeps running without the constraint.`,
        duplicates,
      }
    }

    await db.collection('users').createIndex(EMAIL_KEY, {
      name: USERS_EMAIL_INDEX,
      unique: true,
      partialFilterExpression: EMAIL_IS_STRING,
    })
    return { ok: true, created: true }
  } catch (error) {
    // Duplicates can land between the check and the build: same verdict, no throw.
    if (isDuplicateKeyError(error)) {
      const duplicates = await findDuplicateEmails(db).catch(() => [])
      const detail = duplicates.length
        ? describeDuplicates(duplicates)
        : 'duplicate emails appeared while the index was being built'
      return {
        ok: false,
        reason: 'duplicates',
        message: `users.email unique index not created: ${detail}.`,
        duplicates,
      }
    }
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : String(error),
    }
  }
}
