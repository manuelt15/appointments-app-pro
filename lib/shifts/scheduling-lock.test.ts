import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { lockMocks, sessionMocks } = vi.hoisted(() => {
  const sessionMocks = {
    withTransaction: vi.fn(),
    endSession: vi.fn(),
  }
  const lockMocks = {
    init: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    db: { startSession: vi.fn() },
  }
  return { lockMocks, sessionMocks }
})

vi.mock('@/lib/mongodb/models/SchedulingLock', () => ({
  SchedulingLock: lockMocks,
}))

import {
  SchedulingBusyError,
  buildSchedulingLockKey,
  withSchedulingLock,
} from './scheduling-lock'

describe('scheduling lock', () => {
  beforeEach(() => {
    lockMocks.init.mockReset()
    lockMocks.findOneAndUpdate.mockReset()
    lockMocks.updateOne.mockReset()
    lockMocks.deleteOne.mockReset()
    lockMocks.db.startSession.mockReset()
    sessionMocks.withTransaction.mockReset()
    sessionMocks.endSession.mockReset()
    lockMocks.init.mockResolvedValue(undefined)
    lockMocks.updateOne.mockResolvedValue({ matchedCount: 1 })
    lockMocks.deleteOne.mockResolvedValue({ deletedCount: 1 })
    lockMocks.db.startSession.mockResolvedValue(sessionMocks)
    const unsupportedTransaction = Object.assign(
      new Error('Transaction numbers are only allowed on a replica set member or mongos'),
      { code: 20 }
    )
    sessionMocks.withTransaction.mockRejectedValue(Object.assign(
      new Error('This MongoDB deployment does not support retryable writes.'),
      { originalError: unsupportedTransaction }
    ))
    sessionMocks.endSession.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('scopes the lock to one business and calendar', () => {
    expect(buildSchedulingLockKey('business-1', 'calendar-1')).toBe('business-1:calendar-1')
  })

  it('initializes the unique index and renews ownership before writing', async () => {
    lockMocks.findOneAndUpdate.mockResolvedValue({ key: 'business-1:calendar-1' })

    await expect(withSchedulingLock('business-1', 'calendar-1', async (lease) => {
      await lease.assertOwned()
      return 'created'
    })).resolves.toBe('created')

    expect(lockMocks.init).toHaveBeenCalledOnce()
    expect(lockMocks.updateOne).toHaveBeenCalledOnce()
    expect(lockMocks.deleteOne).toHaveBeenCalledOnce()
  })

  it('binds ownership and the write operation to one transaction when supported', async () => {
    lockMocks.findOneAndUpdate.mockResolvedValue({ key: 'business-1:calendar-1' })
    sessionMocks.withTransaction.mockImplementation(async (operation) => operation())

    await expect(withSchedulingLock('business-1', 'calendar-1', async (lease, session) => {
      expect(session).toBe(sessionMocks)
      await lease.assertOwned()
      return 'created'
    })).resolves.toBe('created')

    expect(sessionMocks.withTransaction).toHaveBeenCalledOnce()
    expect(lockMocks.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ owner: expect.any(String) }),
      expect.any(Object),
      { session: sessionMocks }
    )
    expect(sessionMocks.endSession).toHaveBeenCalledOnce()
  })

  it('releases the lease when the operation fails', async () => {
    lockMocks.findOneAndUpdate.mockResolvedValue({ key: 'business-1:calendar-1' })

    await expect(withSchedulingLock('business-1', 'calendar-1', async () => {
      throw new Error('write failed')
    })).rejects.toThrow('write failed')
    expect(lockMocks.deleteOne).toHaveBeenCalledOnce()
  })

  it('stops the write when ownership has expired', async () => {
    lockMocks.findOneAndUpdate.mockResolvedValue({ key: 'business-1:calendar-1' })
    lockMocks.updateOne.mockResolvedValue({ matchedCount: 0 })

    await expect(withSchedulingLock('business-1', 'calendar-1', async (lease) => {
      await lease.assertOwned()
      return 'created'
    })).rejects.toBeInstanceOf(SchedulingBusyError)

    expect(lockMocks.deleteOne).toHaveBeenCalledOnce()
  })

  it('retries when another request wins the unique-key race', async () => {
    lockMocks.findOneAndUpdate
      .mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 11000 }))
      .mockResolvedValueOnce({ key: 'business-1:calendar-1' })

    await expect(withSchedulingLock('business-1', 'calendar-1', async () => 'created')).resolves.toBe('created')
    expect(lockMocks.findOneAndUpdate).toHaveBeenCalledTimes(2)
  })

  it('returns a busy error when the lease cannot be acquired', async () => {
    vi.useFakeTimers()
    lockMocks.findOneAndUpdate.mockRejectedValue(Object.assign(new Error('duplicate'), { code: 11000 }))

    const result = withSchedulingLock('business-1', 'calendar-1', async () => 'created')
    const assertion = expect(result).rejects.toBeInstanceOf(SchedulingBusyError)
    await vi.advanceTimersByTimeAsync(5_100)

    await assertion
    expect(lockMocks.deleteOne).not.toHaveBeenCalled()
  })
})
