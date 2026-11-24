import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import mongoose from 'mongoose'
import { Employee, buildEmployeeAnonymization } from './Employee'
import { Shift } from './Shift'

// Same rule as indexes.integration.test.ts: only against a throwaway database,
// and the name has to say so, because the suite drops it.
//
//   MONGODB_TEST_URI=mongodb://127.0.0.1:27017/appointments_probe \
//     npx vitest run lib/mongodb/models/Employee.integration.test.ts
const uri = process.env.MONGODB_TEST_URI
const baseName = uri ? new URL(uri).pathname.replace(/^\//, '') : ''
const isThrowaway = /(probe|test)/i.test(baseName)
const suite = uri && isThrowaway ? describe : describe.skip

async function createEmployeeWithPastShift() {
  const employee = await Employee.create({
    businessId: 'business-1',
    fullName: 'Ana Pérez',
    email: 'ana@example.com',
    phone: '+34600111222',
    birthday: '1990-05-04',
    startDate: '2024-01-08',
    color: '#6366f1',
  })

  const shift = await Shift.create({
    businessId: 'business-1',
    employeeId: employee._id.toString(),
    startTime: new Date('2026-10-01T09:00:00.000Z'),
    endTime: new Date('2026-10-01T17:00:00.000Z'),
    type: 'shift',
  })

  return { employee, shift }
}

suite('employee deletion on a real database', () => {
  beforeAll(async () => {
    const connection = new URL(uri!)
    connection.pathname = `/${baseName}-employees`
    await mongoose.connect(connection.toString())
    // Mongoose builds the model indexes in the background right after connect.
    // Waiting for them here keeps a pending createIndexes from re-creating the
    // collections once the suite drops the database.
    await Employee.init()
    await Shift.init()
  })

  beforeEach(async () => {
    await Employee.deleteMany({})
    await Shift.deleteMany({})
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  })

  it('clears email, phone and birthday and keeps the past shift readable', async () => {
    const { employee, shift } = await createEmployeeWithPastShift()
    const startedAt = Date.now() - 1000

    await Employee.updateOne({ _id: employee._id }, buildEmployeeAnonymization(), {
      updatePipeline: true,
    })

    const purged = await Employee.findById(employee._id).lean()
    expect(purged?.isActive).toBe(false)
    expect(purged?.email ?? null).toBeNull()
    expect(purged?.phone ?? null).toBeNull()
    expect(purged?.birthday ?? null).toBeNull()
    expect(purged?.anonymizedAt).toBeInstanceOf(Date)

    // What history needs is still there: the row, the name, the labour dates.
    expect(purged?.fullName).toBe('Ana Pérez')
    expect(purged?.startDate).toBe('2024-01-08')
    expect(purged?.color).toBe('#6366f1')
    expect(purged?.createdAt).toBeInstanceOf(Date)

    // The shift survives and still resolves to a readable name.
    const shifts = await Shift.find({ businessId: 'business-1' }).lean()
    expect(shifts).toHaveLength(1)
    expect(shifts[0]._id.toString()).toBe(shift._id.toString())
    const owner = await Employee.findById(shifts[0].employeeId).lean()
    expect(owner?.fullName).toBe('Ana Pérez')

    expect(purged!.anonymizedAt.getTime()).toBeGreaterThanOrEqual(startedAt)
  })

  it('deleting twice does not move anonymizedAt', async () => {
    const { employee } = await createEmployeeWithPastShift()
    const firstRun = new Date('2026-11-01T08:00:00.000Z')
    const secondRun = new Date('2026-11-24T08:00:00.000Z')

    await Employee.updateOne({ _id: employee._id }, buildEmployeeAnonymization(firstRun), {
      updatePipeline: true,
    })
    await Employee.updateOne({ _id: employee._id }, buildEmployeeAnonymization(secondRun), {
      updatePipeline: true,
    })

    const purged = await Employee.findById(employee._id).lean()
    expect(purged?.anonymizedAt?.toISOString()).toBe(firstRun.toISOString())
  })
})
