import { randomUUID } from 'node:crypto'
import type { ClientSession } from 'mongoose'
import { SchedulingLock } from '@/lib/mongodb/models/SchedulingLock'

const LEASE_DURATION_MS = 30_000
const LEASE_RENEWAL_MS = 10_000
const ACQUIRE_TIMEOUT_MS = 5_000
const RETRY_DELAY_MS = 50

export class SchedulingBusyError extends Error {
  constructor() {
    super('Scheduling is busy. Try again.')
    this.name = 'SchedulingBusyError'
  }
}

export interface SchedulingLease {
  assertOwned: () => Promise<void>
}

type SchedulingOperation<T> = (
  lease: SchedulingLease,
  session: ClientSession | null
) => Promise<T>

export function buildSchedulingLockKey(businessId: string, employeeId: string) {
  return `${businessId}:${employeeId}`
}

export async function withSchedulingLock<T>(
  businessId: string,
  employeeId: string,
  operation: SchedulingOperation<T>
): Promise<T> {
  await SchedulingLock.init()

  const key = buildSchedulingLockKey(businessId, employeeId)
  const owner = randomUUID()
  await acquireLease(key, owner)

  try {
    try {
      return await runInTransaction(key, owner, operation)
    } catch (error) {
      if (!isTransactionUnsupported(error)) throw error
      return await runWithRenewableLease(key, owner, operation)
    }
  } finally {
    try {
      await SchedulingLock.deleteOne({ key, owner })
    } catch {
      // The lease expires automatically if cleanup cannot reach MongoDB.
    }
  }
}

async function acquireLease(key: string, owner: string) {
  const deadline = Date.now() + ACQUIRE_TIMEOUT_MS
  let acquired = false

  while (!acquired && Date.now() < deadline) {
    const now = new Date()

    try {
      const lock = await SchedulingLock.findOneAndUpdate(
        {
          key,
          $or: [
            { expiresAt: { $lte: now } },
            { owner },
          ],
        },
        {
          $set: {
            owner,
            expiresAt: new Date(now.getTime() + LEASE_DURATION_MS),
          },
          $setOnInsert: { key },
        },
        { upsert: true, new: true }
      )
      acquired = Boolean(lock)
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error
    }

    if (!acquired) await delay(RETRY_DELAY_MS)
  }

  if (!acquired) throw new SchedulingBusyError()
}

async function runInTransaction<T>(
  key: string,
  owner: string,
  operation: SchedulingOperation<T>
): Promise<T> {
  const session = await SchedulingLock.db.startSession()
  let result: T | undefined
  let completed = false

  try {
    await session.withTransaction(async () => {
      const lease = createLease(key, owner, session)
      await lease.assertOwned()
      result = await operation(lease, session)
      completed = true
    })
  } finally {
    await session.endSession()
  }

  if (!completed) throw new SchedulingBusyError()
  return result as T
}

async function runWithRenewableLease<T>(
  key: string,
  owner: string,
  operation: SchedulingOperation<T>
): Promise<T> {
  let leaseLost = false
  const lease = createLease(key, owner, null, () => {
    leaseLost = true
  })
  const renewal = setInterval(() => {
    void lease.assertOwned().catch(() => {
      leaseLost = true
    })
  }, LEASE_RENEWAL_MS)

  try {
    const result = await operation(lease, null)
    if (leaseLost) throw new SchedulingBusyError()
    return result
  } finally {
    clearInterval(renewal)
  }
}

function createLease(
  key: string,
  owner: string,
  session: ClientSession | null,
  onLost?: () => void
): SchedulingLease {
  return {
    async assertOwned() {
      const now = new Date()
      const result = await SchedulingLock.updateOne(
        { key, owner, expiresAt: { $gt: now } },
        { $set: { expiresAt: new Date(now.getTime() + LEASE_DURATION_MS) } },
        session ? { session } : undefined
      )
      if (result.matchedCount !== 1) {
        onLost?.()
        throw new SchedulingBusyError()
      }
    },
  }
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000
}

function isTransactionUnsupported(error: unknown, depth = 0): boolean {
  if (depth > 3 || typeof error !== 'object' || error === null) return false
  if ('code' in error && error.code === 20) return true
  if ('message' in error && typeof error.message === 'string') {
    if (
      error.message.includes('Transaction numbers are only allowed') ||
      error.message.includes('does not support retryable writes')
    ) return true
  }
  if ('originalError' in error && isTransactionUnsupported(error.originalError, depth + 1)) return true
  if ('errorResponse' in error && isTransactionUnsupported(error.errorResponse, depth + 1)) return true
  return false
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
