import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'

const { employeeFindOne, shiftFindOne, shiftFindOneAndUpdate, lockMocks, sessionMocks } = vi.hoisted(() => {
  const sessionMocks = { withTransaction: vi.fn(), endSession: vi.fn() }
  const lockMocks = {
    init: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    db: { startSession: vi.fn() },
  }
  return {
    employeeFindOne: vi.fn(),
    shiftFindOne: vi.fn(),
    shiftFindOneAndUpdate: vi.fn(),
    lockMocks,
    sessionMocks,
  }
})

vi.mock('@/lib/api/auth', () => ({ resolveAuth: vi.fn() }))
vi.mock('@/lib/mongodb/client', () => ({ connectDB: vi.fn(async () => undefined) }))
vi.mock('@/lib/mongodb/models/Employee', () => ({ Employee: { findOne: employeeFindOne } }))
vi.mock('@/lib/mongodb/models/SchedulingLock', () => ({ SchedulingLock: lockMocks }))
vi.mock('@/lib/mongodb/models/Shift', () => {
  class FakeShift {}
  ;(FakeShift as unknown as { findOne: typeof shiftFindOne }).findOne = shiftFindOne
  ;(FakeShift as unknown as { findOneAndUpdate: typeof shiftFindOneAndUpdate }).findOneAndUpdate =
    shiftFindOneAndUpdate
  return { Shift: FakeShift }
})

import { PUT } from './route'

const UPPER_ID = '507F1F77BCF86CD799439011'
const LOWER_ID = UPPER_ID.toLowerCase()
const SHIFT_ID = '507f1f77bcf86cd799439099'

const query = (result: unknown) => ({
  select: () => Promise.resolve(result),
  session: () => Promise.resolve(result),
})

const context = { params: Promise.resolve({ id: SHIFT_ID }) } as unknown as RouteContext<'/api/shifts/[id]'>

const request = () =>
  new NextRequest(`http://localhost/api/shifts/${SHIFT_ID}`, {
    method: 'PUT',
    body: JSON.stringify({
      startTime: '2026-09-13T09:00:00.000Z',
      endTime: '2026-09-13T17:00:00.000Z',
    }),
  })

describe('PUT /api/shifts/[id] con employeeId historico en mayusculas', () => {
  beforeEach(() => {
    vi.mocked(resolveAuth).mockReset()
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', authType: 'session' })
    employeeFindOne.mockReset()
    shiftFindOne.mockReset()
    shiftFindOneAndUpdate.mockReset()
    lockMocks.init.mockReset()
    lockMocks.findOneAndUpdate.mockReset()
    lockMocks.updateOne.mockReset()
    lockMocks.deleteOne.mockReset()
    lockMocks.db.startSession.mockReset()
    sessionMocks.withTransaction.mockReset()
    sessionMocks.endSession.mockReset()

    const initial = { employeeId: UPPER_ID }
    const current = {
      employeeId: UPPER_ID,
      startTime: new Date('2026-09-12T09:00:00.000Z'),
      endTime: new Date('2026-09-12T17:00:00.000Z'),
      __v: 0,
    }
    shiftFindOne.mockImplementationOnce(() => query(initial))
    shiftFindOne.mockImplementation((filter: { startTime?: unknown }) =>
      'startTime' in filter ? query(null) : query(current)
    )
    employeeFindOne.mockImplementation(() => query({ _id: { toString: () => LOWER_ID } }))
    shiftFindOneAndUpdate.mockImplementation(async (_filter, update) => ({
      _id: SHIFT_ID,
      ...update.$set,
    }))

    lockMocks.init.mockResolvedValue(undefined)
    lockMocks.findOneAndUpdate.mockImplementation(async (filter: { key: string }) => ({ key: filter.key }))
    lockMocks.updateOne.mockResolvedValue({ matchedCount: 1 })
    lockMocks.deleteOne.mockResolvedValue({ deletedCount: 1 })
    lockMocks.db.startSession.mockResolvedValue(sessionMocks)
    sessionMocks.withTransaction.mockImplementation(async (operation: () => unknown) => operation())
    sessionMocks.endSession.mockResolvedValue(undefined)
  })

  it('bloquea por el id canonico y guarda el employeeId en minusculas', async () => {
    const response = await PUT(request(), context)

    expect(response.status).toBe(200)
    const keys = lockMocks.findOneAndUpdate.mock.calls.map(
      (call) => (call[0] as { key: string }).key
    )
    expect(keys).toEqual([`b1:${LOWER_ID}`])
    const update = shiftFindOneAndUpdate.mock.calls[0][1] as { $set: { employeeId: string } }
    expect(update.$set.employeeId).toBe(LOWER_ID)
  })

  it('devuelve 409 si el turno movido solapa con otro del mismo empleado', async () => {
    shiftFindOne.mockReset()
    const initial = { employeeId: UPPER_ID }
    const current = {
      employeeId: UPPER_ID,
      startTime: new Date('2026-09-12T09:00:00.000Z'),
      endTime: new Date('2026-09-12T17:00:00.000Z'),
      __v: 0,
    }
    shiftFindOne.mockImplementationOnce(() => query(initial))
    shiftFindOne.mockImplementation((filter: { startTime?: unknown }) =>
      'startTime' in filter ? query({ _id: { toString: () => 'shift-2' } }) : query(current)
    )

    const response = await PUT(request(), context)

    expect(response.status).toBe(409)
    expect(shiftFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: LOWER_ID, businessId: 'b1' })
    )
    expect(shiftFindOneAndUpdate).not.toHaveBeenCalled()
  })
})
