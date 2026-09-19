import { describe, expect, it } from 'vitest'
import { ANNUAL_VACATION_DAYS, vacationBalance, vacationDaysInMonth, vacationDaysTaken } from './vacation'
import type { Shift } from '@/types'

function vacation(startTime: string, endTime: string): Shift {
  return {
    _id: Math.random().toString(36).slice(2),
    businessId: 'b1',
    employeeId: 'e1',
    startTime,
    endTime,
    type: 'vacation',
    createdAt: '',
    updatedAt: '',
  }
}

function workingShift(startTime: string, endTime: string): Shift {
  return { ...vacation(startTime, endTime), type: 'shift' }
}

describe('vacation days taken', () => {
  it('is zero without vacation', () => {
    expect(vacationDaysTaken([], 2026)).toBe(0)
    expect(vacationDaysTaken([workingShift('2026-09-14T07:00:00Z', '2026-09-14T15:00:00Z')], 2026)).toBe(0)
  })

  it('counts every calendar day a booking spans', () => {
    // 14 to 20 September inclusive.
    expect(vacationDaysTaken([vacation('2026-09-14T00:00:00', '2026-09-20T23:59:00')], 2026)).toBe(7)
  })

  it('does not claim the day a booking ends on at midnight', () => {
    expect(vacationDaysTaken([vacation('2026-09-14T00:00:00', '2026-09-16T00:00:00')], 2026)).toBe(2)
  })

  it('counts a single day booking as one day', () => {
    expect(vacationDaysTaken([vacation('2026-09-14T09:00:00', '2026-09-14T17:00:00')], 2026)).toBe(1)
  })

  it('never counts the same day twice across overlapping bookings', () => {
    const days = vacationDaysTaken([
      vacation('2026-09-14T00:00:00', '2026-09-17T00:00:00'),
      vacation('2026-09-16T00:00:00', '2026-09-18T00:00:00'),
    ], 2026)

    expect(days).toBe(4)
  })

  it('ignores days belonging to another year', () => {
    const days = vacationDaysTaken([vacation('2025-12-30T00:00:00', '2026-01-03T00:00:00')], 2026)

    expect(days).toBe(2)
  })
})

describe('vacation balance', () => {
  it('starts with the full allowance', () => {
    expect(vacationBalance([], 2026)).toEqual({
      allowance: ANNUAL_VACATION_DAYS,
      taken: 0,
      remaining: ANNUAL_VACATION_DAYS,
    })
  })

  it('subtracts the days taken', () => {
    const balance = vacationBalance([vacation('2026-09-14T00:00:00', '2026-09-20T23:59:00')], 2026)

    expect(balance.taken).toBe(7)
    expect(balance.remaining).toBe(23)
  })

  it('never goes negative when the allowance is exceeded', () => {
    const balance = vacationBalance(
      [vacation('2026-01-01T00:00:00', '2026-03-01T00:00:00')],
      2026
    )

    expect(balance.taken).toBeGreaterThan(ANNUAL_VACATION_DAYS)
    expect(balance.remaining).toBe(0)
  })

  it('accepts a different allowance', () => {
    expect(vacationBalance([], 2026, 22).remaining).toBe(22)
  })
})

describe('vacation days within a month', () => {
  it('splits a booking that crosses months', () => {
    const shifts = [vacation('2026-08-30T00:00:00', '2026-09-03T00:00:00')]

    expect(vacationDaysInMonth(shifts, 2026, 7)).toBe(2)
    expect(vacationDaysInMonth(shifts, 2026, 8)).toBe(2)
  })

  it('is zero for a month with no vacation', () => {
    expect(vacationDaysInMonth([vacation('2026-09-14T00:00:00', '2026-09-16T00:00:00')], 2026, 9)).toBe(0)
  })
})
