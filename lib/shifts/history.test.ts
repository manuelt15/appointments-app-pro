import { describe, expect, it } from 'vitest'
import { monthsWithShifts, shiftsInMonth, summariseHistory } from './history'
import type { Shift } from '@/types'

function shift(partial: Partial<Shift>): Shift {
  return {
    _id: Math.random().toString(36).slice(2),
    businessId: 'business-1',
    employeeId: 'employee-1',
    startTime: '2026-09-14T07:00:00.000Z',
    endTime: '2026-09-14T15:00:00.000Z',
    type: 'shift',
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('history summary', () => {
  it('returns an empty summary with no shifts', () => {
    expect(summariseHistory([])).toEqual({
      total: 0,
      workedShifts: 0,
      absences: 0,
      hours: 0,
      firstShift: null,
      lastShift: null,
    })
  })

  it('adds up hours of working shifts only', () => {
    const summary = summariseHistory([
      shift({}),
      shift({ startTime: '2026-09-15T07:00:00.000Z', endTime: '2026-09-15T15:00:00.000Z' }),
      shift({
        type: 'vacation',
        startTime: '2026-09-16T00:00:00.000Z',
        endTime: '2026-09-20T00:00:00.000Z',
      }),
    ])

    expect(summary.hours).toBe(16)
    expect(summary.workedShifts).toBe(2)
    expect(summary.absences).toBe(1)
    expect(summary.total).toBe(3)
  })

  it('finds the first and last shift regardless of input order', () => {
    const summary = summariseHistory([
      shift({ startTime: '2026-09-20T07:00:00.000Z', endTime: '2026-09-20T15:00:00.000Z' }),
      shift({ startTime: '2026-03-02T07:00:00.000Z', endTime: '2026-03-02T15:00:00.000Z' }),
      shift({ startTime: '2026-09-14T07:00:00.000Z', endTime: '2026-09-14T15:00:00.000Z' }),
    ])

    expect(summary.firstShift).toBe('2026-03-02T07:00:00.000Z')
    expect(summary.lastShift).toBe('2026-09-20T07:00:00.000Z')
  })

  it('rounds hours to one decimal instead of leaking float noise', () => {
    const summary = summariseHistory([
      shift({ startTime: '2026-09-14T07:00:00.000Z', endTime: '2026-09-14T14:20:00.000Z' }),
    ])

    expect(summary.hours).toBe(7.3)
  })
})

describe('grouping history by month', () => {
  const september = shift({ startTime: '2026-09-14T07:00:00.000Z', endTime: '2026-09-14T15:00:00.000Z' })
  const august = shift({ startTime: '2026-08-03T07:00:00.000Z', endTime: '2026-08-03T15:00:00.000Z' })
  const lastYear = shift({ startTime: '2025-12-02T07:00:00.000Z', endTime: '2025-12-02T15:00:00.000Z' })

  it('lists only months that have something, newest first', () => {
    const months = monthsWithShifts([august, lastYear, september])

    expect(months).toEqual([
      { year: 2026, month: 8 },
      { year: 2026, month: 7 },
      { year: 2025, month: 11 },
    ])
  })

  it('is empty without shifts', () => {
    expect(monthsWithShifts([])).toEqual([])
  })

  it('lists both months for a booking that crosses one', () => {
    const across = shift({
      type: 'vacation',
      startTime: '2026-08-30T00:00:00.000Z',
      endTime: '2026-09-03T00:00:00.000Z',
    })

    expect(monthsWithShifts([across])).toEqual([
      { year: 2026, month: 8 },
      { year: 2026, month: 7 },
    ])
  })

  it('keeps each shift in its own month', () => {
    expect(shiftsInMonth([august, september], 2026, 8)).toEqual([september])
    expect(shiftsInMonth([august, september], 2026, 7)).toEqual([august])
  })

  it('includes a booking that only partially covers the month', () => {
    const across = shift({
      type: 'vacation',
      startTime: '2026-08-30T00:00:00.000Z',
      endTime: '2026-09-03T00:00:00.000Z',
    })

    expect(shiftsInMonth([across], 2026, 8)).toHaveLength(1)
    expect(shiftsInMonth([across], 2026, 7)).toHaveLength(1)
  })
})
