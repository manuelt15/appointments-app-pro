import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'

const { employeeFindOne, employeeFindOneAndUpdate, employeeUpdateOne, shiftDeleteMany, lockMocks, sessionMocks } =
  vi.hoisted(() => {
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
      employeeFindOneAndUpdate: vi.fn(),
      employeeUpdateOne: vi.fn(),
      shiftDeleteMany: vi.fn(),
      lockMocks,
      sessionMocks,
    }
  })

vi.mock('@/lib/api/auth', () => ({ resolveAuth: vi.fn() }))
vi.mock('@/lib/mongodb/client', () => ({ connectDB: vi.fn(async () => undefined) }))
vi.mock('@/lib/mongodb/models/Employee', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/mongodb/models/Employee')>()
  return {
    ...actual,
    Employee: {
      findOne: employeeFindOne,
      findOneAndUpdate: employeeFindOneAndUpdate,
      updateOne: employeeUpdateOne,
    },
  }
})
vi.mock('@/lib/mongodb/models/Shift', () => ({ Shift: { deleteMany: shiftDeleteMany } }))
vi.mock('@/lib/mongodb/models/SchedulingLock', () => ({ SchedulingLock: lockMocks }))

import { DELETE, GET, PUT } from './route'

const UPPER_ID = '507F1F77BCF86CD799439011'
const LOWER_ID = UPPER_ID.toLowerCase()

const context = (id: string) => ({ params: Promise.resolve({ id }) }) as unknown as RouteContext<'/api/employees/[id]'>

const request = (method: string, body?: unknown) =>
  new NextRequest(`http://localhost/api/employees/${UPPER_ID}`, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

/** Employee row as Mongoose returns it. */
const employeeRow = (businessId = 'b1') => ({
  _id: { toString: () => LOWER_ID },
  businessId,
  fullName: 'Ana',
  isActive: true,
})

/**
 * Mongoose queries are thenable AND expose `.lean()`: GET awaits `.lean()`,
 * DELETE awaits the query itself.
 */
const query = <T,>(result: T) => {
  const promise = Promise.resolve(result)
  return {
    lean: () => promise,
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  }
}

const employeeDoc = (businessId = 'b1') =>
  query({ ...employeeRow(businessId), lean: () => Promise.resolve(employeeRow(businessId)) })

describe('app/api/employees/[id] con el id de la URL en mayusculas', () => {
  beforeEach(() => {
    vi.mocked(resolveAuth).mockReset()
    vi.mocked(resolveAuth).mockResolvedValue({ businessId: 'b1', authType: 'session' })
    employeeFindOne.mockReset()
    employeeFindOneAndUpdate.mockReset()
    employeeUpdateOne.mockReset()
    shiftDeleteMany.mockReset()
    lockMocks.init.mockReset()
    lockMocks.findOneAndUpdate.mockReset()
    lockMocks.updateOne.mockReset()
    lockMocks.deleteOne.mockReset()
    lockMocks.db.startSession.mockReset()
    sessionMocks.withTransaction.mockReset()
    sessionMocks.endSession.mockReset()

    employeeFindOne.mockImplementation(() => employeeDoc())
    employeeFindOneAndUpdate.mockImplementation(async () => ({ _id: LOWER_ID, fullName: 'Ana' }))
    employeeUpdateOne.mockResolvedValue({ matchedCount: 1 })
    shiftDeleteMany.mockResolvedValue({ deletedCount: 0 })

    lockMocks.init.mockResolvedValue(undefined)
    lockMocks.findOneAndUpdate.mockImplementation(async (filter: { key: string }) => ({ key: filter.key }))
    lockMocks.updateOne.mockResolvedValue({ matchedCount: 1 })
    lockMocks.deleteOne.mockResolvedValue({ deletedCount: 1 })
    lockMocks.db.startSession.mockResolvedValue(sessionMocks)
    sessionMocks.withTransaction.mockImplementation(async (operation: () => unknown) => operation())
    sessionMocks.endSession.mockResolvedValue(undefined)
  })

  it('GET resuelve al mismo empleado con el id canonico', async () => {
    const response = await GET(request('GET'), context(UPPER_ID))

    expect(response.status).toBe(200)
    expect(employeeFindOne).toHaveBeenCalledWith({ _id: LOWER_ID, businessId: 'b1' })
  })

  it('PUT actualiza al mismo empleado con el id canonico', async () => {
    const response = await PUT(request('PUT', { fullName: 'Ana' }), context(UPPER_ID))

    expect(response.status).toBe(200)
    expect(employeeFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: LOWER_ID, businessId: 'b1' },
      { fullName: 'Ana' },
      { new: true }
    )
  })

  it('DELETE bloquea y borra turnos con la clave canonica del empleado resuelto', async () => {
    const response = await DELETE(request('DELETE'), context(UPPER_ID))

    expect(response.status).toBe(200)
    const keys = lockMocks.findOneAndUpdate.mock.calls.map((call) => (call[0] as { key: string }).key)
    expect(keys).toEqual([`b1:${LOWER_ID}`])
    expect(shiftDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: LOWER_ID, businessId: 'b1' }),
      expect.anything()
    )
  })

  it('DELETE sigue anonimizando la fila resuelta', async () => {
    await DELETE(request('DELETE'), context(UPPER_ID))

    expect(employeeUpdateOne).toHaveBeenCalledTimes(1)
    const [filter, pipeline, options] = employeeUpdateOne.mock.calls[0] as [
      { _id: string; businessId: string },
      [{ $set: Record<string, unknown> }],
      { updatePipeline: boolean },
    ]
    expect(filter).toEqual({ _id: LOWER_ID, businessId: 'b1' })
    expect(options).toEqual({ updatePipeline: true })
    expect(pipeline[0].$set.email).toBeNull()
    expect(pipeline[0].$set.phone).toBeNull()
    expect(pipeline[0].$set.birthday).toBeNull()
    expect(pipeline[0].$set.isActive).toBe(false)
    expect(pipeline[0].$set.anonymizedAt).toBeTruthy()
  })

  it('DELETE mantiene el 404 de un empleado de otro negocio', async () => {
    employeeFindOne.mockImplementation(() => query(null))

    const response = await DELETE(request('DELETE'), context(UPPER_ID))

    expect(response.status).toBe(404)
    expect(employeeFindOne).toHaveBeenCalledWith({ _id: LOWER_ID, businessId: 'b1' })
    expect(lockMocks.findOneAndUpdate).not.toHaveBeenCalled()
    expect(employeeUpdateOne).not.toHaveBeenCalled()
    expect(shiftDeleteMany).not.toHaveBeenCalled()
  })

  it.each([
    ['GET', () => GET(request('GET'), context('no-es-un-objectid'))],
    ['PUT', () => PUT(request('PUT', { fullName: 'Ana' }), context('no-es-un-objectid'))],
    ['DELETE', () => DELETE(request('DELETE'), context('no-es-un-objectid'))],
  ])('%s con un id invalido responde 404 sin consultar', async (_method, call) => {
    const response = await call()

    expect(response.status).toBe(404)
    expect(employeeFindOne).not.toHaveBeenCalled()
    expect(employeeFindOneAndUpdate).not.toHaveBeenCalled()
    expect(employeeUpdateOne).not.toHaveBeenCalled()
    expect(shiftDeleteMany).not.toHaveBeenCalled()
    expect(lockMocks.findOneAndUpdate).not.toHaveBeenCalled()
  })
})
