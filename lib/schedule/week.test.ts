import { describe, expect, it } from 'vitest'
import { buildEmployeeWeeks, resolveWeekStart, weekEnd, weekRangeLabel } from './week'
import type { Employee, Shift } from '@/types'

const ana: Employee = {
  _id: 'ana', businessId: 'b1', fullName: 'Ana', color: '#000', isActive: true, createdAt: '',
}
const carlos: Employee = {
  _id: 'carlos', businessId: 'b1', fullName: 'Carlos', color: '#111', isActive: true, createdAt: '',
}

function shift(partial: Partial<Shift>): Shift {
  return {
    _id: Math.random().toString(36).slice(2),
    businessId: 'b1',
    employeeId: 'ana',
    startTime: '2026-09-14T07:00:00.000Z',
    endTime: '2026-09-14T15:00:00.000Z',
    type: 'shift',
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

const MADRID = 'Europe/Madrid'
// Monday 14 September 2026, 00:00 in Madrid (CEST, UTC+2).
const weekStart = new Date('2026-09-13T22:00:00.000Z')

describe('building the week for export', () => {
  it('gives every employee seven days', () => {
    const weeks = buildEmployeeWeeks([ana, carlos], [], weekStart, MADRID)

    expect(weeks).toHaveLength(2)
    expect(weeks[0].days).toHaveLength(7)
  })

  it('flags an employee with nothing scheduled', () => {
    const weeks = buildEmployeeWeeks([ana], [], weekStart, MADRID)

    expect(weeks[0].hasAnything).toBe(false)
    expect(weeks[0].hours).toBe(0)
  })

  it('keeps each employee to their own shifts', () => {
    const weeks = buildEmployeeWeeks(
      [ana, carlos],
      [shift({ employeeId: 'ana' })],
      weekStart,
      MADRID
    )

    expect(weeks[0].hasAnything).toBe(true)
    expect(weeks[1].hasAnything).toBe(false)
  })

  it('spreads an absence across every day it covers', () => {
    const weeks = buildEmployeeWeeks(
      [ana],
      [shift({
        type: 'vacation',
        startTime: '2026-09-14T00:00:00.000Z',
        endTime: '2026-09-17T00:00:00.000Z',
      })],
      weekStart,
      MADRID
    )

    const withEntries = weeks[0].days.filter((day) => day.entries.length > 0)
    expect(withEntries.length).toBeGreaterThanOrEqual(3)
    expect(withEntries[0].entries[0]).toBe('Vacation')
  })

  it('does not count absences as worked hours', () => {
    const weeks = buildEmployeeWeeks(
      [ana],
      [shift({
        type: 'sick_leave',
        startTime: '2026-09-14T00:00:00.000Z',
        endTime: '2026-09-16T00:00:00.000Z',
      })],
      weekStart,
      MADRID
    )

    expect(weeks[0].hours).toBe(0)
  })
})

describe('business time zone', () => {
  it('labels days and times in business time, whatever the server runs in', () => {
    const weeks = buildEmployeeWeeks([ana], [shift({})], weekStart, MADRID)

    expect(weeks[0].days[0].label).toBe('Mon 14')
    expect(weeks[0].days[0].fullLabel).toBe('Monday 14 September')
    expect(weeks[0].days[6].label).toBe('Sun 20')
    expect(weeks[0].days[0].entries).toEqual(['09:00 - 17:00'])
    expect(weeks[0].hours).toBe(8)
  })

  it('splits a shift at local midnight, not UTC midnight', () => {
    const weeks = buildEmployeeWeeks(
      [ana],
      // Monday 20:00 to Tuesday 02:00 in Madrid.
      [shift({ startTime: '2026-09-14T18:00:00.000Z', endTime: '2026-09-15T00:00:00.000Z' })],
      weekStart,
      MADRID
    )

    expect(weeks[0].days[0].entries).toEqual(['20:00 - 00:00'])
    expect(weeks[0].days[1].entries).toEqual(['00:00 - 02:00'])
    expect(weeks[0].hours).toBe(6)
  })

  it('keeps the last hour of Sunday when the clocks go back', () => {
    // Monday 19 October 2026, 00:00 CEST. DST ends on Sunday 25 October.
    const dstWeek = new Date('2026-10-18T22:00:00.000Z')
    const weeks = buildEmployeeWeeks(
      [ana],
      // Sunday 25 October, 23:00 to 23:30 CET.
      [shift({ startTime: '2026-10-25T22:00:00.000Z', endTime: '2026-10-25T22:30:00.000Z' })],
      dstWeek,
      MADRID
    )

    expect(weekEnd(dstWeek, MADRID).toISOString()).toBe('2026-10-25T23:00:00.000Z')
    expect(weeks[0].days[6].label).toBe('Sun 25')
    expect(weeks[0].days[6].entries).toEqual(['23:00 - 23:30'])
  })
})

describe('week boundaries', () => {
  it('snaps any moment to Monday 00:00 in the business time zone', () => {
    const monday = '2026-09-13T22:00:00.000Z'

    // What a browser in Madrid sends for "this week".
    expect(resolveWeekStart(monday, MADRID).toISOString()).toBe(monday)
    expect(resolveWeekStart('2026-09-17T10:00:00.000Z', MADRID).toISOString()).toBe(monday)
    // Sunday 23:30 in Madrid is still the same week.
    expect(resolveWeekStart('2026-09-20T21:30:00.000Z', MADRID).toISOString()).toBe(monday)
  })

  it('uses the time zone it is given', () => {
    expect(resolveWeekStart('2026-09-17T10:00:00.000Z', 'America/New_York').toISOString())
      .toBe('2026-09-14T04:00:00.000Z')
  })

  it('falls back to the current week on rubbish input', () => {
    for (const value of ['not-a-date', null]) {
      const start = resolveWeekStart(value, MADRID)
      expect(resolveWeekStart(new Date().toISOString(), MADRID).toISOString()).toBe(start.toISOString())
    }
  })

  it('labels the range from Monday to Sunday', () => {
    expect(weekRangeLabel(weekStart, MADRID)).toBe('14 Sep - 20 Sep 2026')
  })
})
