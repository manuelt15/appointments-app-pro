import { describe, expect, it } from 'vitest'
import { toPlainEmployee, toPlainShift } from './serialize'

/** Stands in for a Mongo ObjectId: an object whose toString is the hex id. */
class FakeObjectId {
  constructor(private readonly hex: string) {}
  toString() { return this.hex }
}

describe('normalising documents out of mongo', () => {
  it('turns an ObjectId employee id into a string', () => {
    const employee = toPlainEmployee({
      _id: new FakeObjectId('6aaef8f96b501d2a171596e9'),
      businessId: 'b1',
      fullName: 'Lucia',
      color: '#000',
      isActive: true,
    })

    expect(typeof employee._id).toBe('string')
    expect(employee._id).toBe('6aaef8f96b501d2a171596e9')
  })

  it('makes an employee id comparable to a shift employeeId', () => {
    const id = '6aaef8f96b501d2a171596e9'
    const employee = toPlainEmployee({ _id: new FakeObjectId(id) })
    const shift = toPlainShift({
      _id: new FakeObjectId('aaa'),
      employeeId: id,
      startTime: new Date('2026-09-15T07:00:00.000Z'),
      endTime: new Date('2026-09-15T15:00:00.000Z'),
    })

    // This is the comparison that silently failed before.
    expect(shift.employeeId === employee._id).toBe(true)
  })

  it('converts Date fields into ISO strings', () => {
    const shift = toPlainShift({
      _id: 'x',
      employeeId: 'y',
      startTime: new Date('2026-09-15T07:00:00.000Z'),
      endTime: new Date('2026-09-15T15:00:00.000Z'),
    })

    expect(shift.startTime).toBe('2026-09-15T07:00:00.000Z')
    expect(typeof shift.endTime).toBe('string')
  })

  it('leaves already plain values alone', () => {
    const shift = toPlainShift({
      _id: 'x',
      employeeId: 'y',
      startTime: '2026-09-15T07:00:00.000Z',
      endTime: '2026-09-15T15:00:00.000Z',
    })

    expect(shift.employeeId).toBe('y')
    expect(shift.startTime).toBe('2026-09-15T07:00:00.000Z')
  })
})
