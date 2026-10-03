import { describe, expect, it } from 'vitest'
import {
  businessMonthRange,
  businessYearRange,
  shiftHoursInRange,
  summariseEmployeesInRange,
  summariseYear,
} from './business-history'
import type { Shift } from '@/types'

const MADRID = 'Europe/Madrid'

function shift(partial: Partial<Shift>): Shift {
  return {
    _id: Math.random().toString(36).slice(2),
    businessId: 'business-1',
    employeeId: 'employee-1',
    startTime: '2026-10-14T07:00:00.000Z',
    endTime: '2026-10-14T15:00:00.000Z',
    type: 'shift',
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('business month range', () => {
  it('uses the business time zone, including the DST change at the end of October', () => {
    const range = businessMonthRange(2026, 9, MADRID)
    expect(range.start.toISOString()).toBe('2026-09-30T22:00:00.000Z')
    expect(range.end.toISOString()).toBe('2026-10-31T23:00:00.000Z')
  })

  it('covers the whole year', () => {
    const range = businessYearRange(2026, MADRID)
    expect(range.start.toISOString()).toBe('2025-12-31T23:00:00.000Z')
    expect(range.end.toISOString()).toBe('2026-12-31T23:00:00.000Z')
  })
})

describe('employees in a month', () => {
  const october = businessMonthRange(2026, 9, MADRID)

  it('adds up hours, shifts, distinct days and absences per employee', () => {
    const rows = summariseEmployeesInRange([
      shift({}),
      shift({ startTime: '2026-10-14T16:00:00.000Z', endTime: '2026-10-14T18:00:00.000Z' }),
      shift({ startTime: '2026-10-15T07:00:00.000Z', endTime: '2026-10-15T15:00:00.000Z' }),
      shift({ type: 'vacation', startTime: '2026-10-20T00:00:00.000Z', endTime: '2026-10-22T00:00:00.000Z' }),
      shift({ employeeId: 'employee-2' }),
    ], october, MADRID)

    expect(rows).toEqual([
      { employeeId: 'employee-1', workedShifts: 3, hours: 18, daysWorked: 2, absences: 1 },
      { employeeId: 'employee-2', workedShifts: 1, hours: 8, daysWorked: 1, absences: 0 },
    ])
  })

  it('ignores shifts outside the month', () => {
    expect(summariseEmployeesInRange([
      shift({ startTime: '2026-09-14T07:00:00.000Z', endTime: '2026-09-14T15:00:00.000Z' }),
    ], october, MADRID)).toEqual([])
  })

  it('only counts the part of a night shift that falls inside the month', () => {
    const overnight = shift({ startTime: '2026-10-31T21:00:00.000Z', endTime: '2026-11-01T05:00:00.000Z' })
    expect(shiftHoursInRange(overnight, october)).toBe(2)
    expect(shiftHoursInRange(overnight, businessMonthRange(2026, 10, MADRID))).toBe(6)
  })

  it('counts the working day in business time, not UTC', () => {
    const lateShift = shift({ startTime: '2026-10-14T22:30:00.000Z', endTime: '2026-10-14T23:30:00.000Z' })
    const rows = summariseEmployeesInRange([shift({}), lateShift], october, MADRID)
    expect(rows[0].daysWorked).toBe(2)
  })
})

describe('year overview', () => {
  it('returns twelve months with totals and distinct working employees', () => {
    const months = summariseYear([
      shift({}),
      shift({ employeeId: 'employee-2' }),
      shift({ employeeId: 'employee-3', type: 'sick_leave' }),
      shift({ startTime: '2026-03-02T08:00:00.000Z', endTime: '2026-03-02T12:00:00.000Z' }),
    ], 2026, MADRID)

    expect(months).toHaveLength(12)
    expect(months[9]).toEqual({ month: 9, hours: 16, workedShifts: 2, employees: 2, absences: 1 })
    expect(months[2]).toEqual({ month: 2, hours: 4, workedShifts: 1, employees: 1, absences: 0 })
    expect(months[0]).toEqual({ month: 0, hours: 0, workedShifts: 0, employees: 0, absences: 0 })
  })
})
