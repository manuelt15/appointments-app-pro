import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'

const { employeeFindOne, shiftFindOne, shiftDocs, saveRecord, lockMocks, sessionMocks } = vi.hoisted(() => {
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
    shiftDocs: [] as Array<Record<string, unknown>>,
    saveRecord: vi.fn(),
    lockMocks,
    sessionMocks,
  }
})

vi.mock('@/lib/api/auth', () => ({ resolveAuth: vi.fn() }))
vi.mock('@/lib/mongodb/client', () => ({ connectDB: vi.fn(async () => undefined) }))
vi.mock('@/lib/mongodb/models/Employee', () => ({ Employee: { findOne: employeeFindOne } }))
vi.mock('@/lib/mongodb/models/SchedulingLock', () => ({ SchedulingLock: lockMocks }))
vi.mock('@/lib/mongodb/models/Shift', () => {
  class FakeShift {
    constructor(doc: Record<string, unknown>) {
      shiftDocs.push(doc)
    }

    save = saveRecord
  }
  ;(FakeShift as unknown as { findOne: typeof shiftFindOne }).findOne = shiftFindOne
  return { Shift: FakeShift }
})

import { POST } from './route'

const UPPER_ID = '507F1F77BCF86CD799439011'
const LOWER_ID = UPPER_ID.toLowerCase()

const query = (result: unknown) => ({ session: () => Promise.resolve(result) })

const request = (employeeId = UPPER_ID) =>
  new NextRequest('http://localhost/api/shifts', {
    method: 'POST',
    body: JSON.stringify({
      employeeId,
      startTime: '2026-09-12T09:00:00.000Z',
      endTime: '2026-09-12T17:00:00.000Z',
    }),
  })

describe('POST /api/shifts', () => {
  beforeEach(() => {
    vi.mocked(resolveAuth).mockReset()
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', authType: 'session' })
    employeeFindOne.mockReset()
    shiftFindOne.mockReset()
    saveRecord.mockReset()
    saveRecord.mockResolvedValue(undefined)
    shiftDocs.length = 0
    lockMocks.init.mockReset()
    lockMocks.findOneAndUpdate.mockReset()
    lockMocks.updateOne.mockReset()
    lockMocks.deleteOne.mockReset()
    lockMocks.db.startSession.mockReset()
    sessionMocks.withTransaction.mockReset()
    sessionMocks.endSession.mockReset()

    lockMocks.init.mockResolvedValue(undefined)
    lockMocks.findOneAndUpdate.mockImplementation(async (filter: { key: string }) => ({ key: filter.key }))
    lockMocks.updateOne.mockResolvedValue({ matchedCount: 1 })
    lockMocks.deleteOne.mockResolvedValue({ deletedCount: 1 })
    lockMocks.db.startSession.mockResolvedValue(sessionMocks)
    sessionMocks.withTransaction.mockImplementation(async (operation: () => unknown) => operation())
    sessionMocks.endSession.mockResolvedValue(undefined)
  })

  it('devuelve 409 si el turno se solapa aunque el employeeId venga en mayusculas', async () => {
    employeeFindOne.mockImplementation(() => query({ _id: { toString: () => LOWER_ID } }))
    shiftFindOne.mockImplementation(() => query({ _id: { toString: () => 'shift-1' } }))

    const response = await POST(request(UPPER_ID))

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ details: { conflictId: 'shift-1' } })
    expect(shiftFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: LOWER_ID, businessId: 'b1' })
    )
    expect(saveRecord).not.toHaveBeenCalled()
  })

  it('usa la misma clave de bloqueo para las dos grafias del mismo id', async () => {
    employeeFindOne.mockImplementation(() => query({ _id: { toString: () => LOWER_ID } }))
    shiftFindOne.mockImplementation(() => query(null))

    await POST(request(UPPER_ID))
    await POST(request(LOWER_ID))

    const keys = lockMocks.findOneAndUpdate.mock.calls.map(
      (call) => (call[0] as { key: string }).key
    )
    expect(keys).toEqual([`b1:${LOWER_ID}`, `b1:${LOWER_ID}`])
  })

  it('persiste el employeeId canonico en minusculas', async () => {
    employeeFindOne.mockImplementation(() => query({ _id: { toString: () => LOWER_ID } }))
    shiftFindOne.mockImplementation(() => query(null))

    const response = await POST(request(UPPER_ID))

    expect(response.status).toBe(201)
    expect(shiftDocs).toHaveLength(1)
    expect(shiftDocs[0].employeeId).toBe(LOWER_ID)
  })

  it('mantiene el 404 cuando el empleado es de otro negocio', async () => {
    employeeFindOne.mockImplementation(() => query(null))

    const response = await POST(request(UPPER_ID))

    expect(response.status).toBe(404)
    expect(employeeFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: LOWER_ID, businessId: 'b1', isActive: true })
    )
    expect(saveRecord).not.toHaveBeenCalled()
  })
})
