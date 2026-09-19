import { describe, expect, it } from 'vitest'
import { buildEmployeeWeeks, resolveWeekStart, weekRangeLabel } from './week'
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

const weekStart = new Date(2026, 8, 14)

describe('building the week for export', () => {
  it('gives every employee seven days', () => {
    const weeks = buildEmployeeWeeks([ana, carlos], [], weekStart)

    expect(weeks).toHaveLength(2)
    expect(weeks[0].days).toHaveLength(7)
  })

  it('flags an employee with nothing scheduled', () => {
    const weeks = buildEmployeeWeeks([ana], [], weekStart)

    expect(weeks[0].hasAnything).toBe(false)
    expect(weeks[0].hours).toBe(0)
  })

  it('keeps each employee to their own shifts', () => {
    const weeks = buildEmployeeWeeks(
      [ana, carlos],
      [shift({ employeeId: 'ana' })],
      weekStart
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
      weekStart
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
      weekStart
    )

    expect(weeks[0].hours).toBe(0)
  })
})

describe('week boundaries', () => {
  it('snaps any day to the Monday of its week', () => {
    expect(resolveWeekStart('2026-09-17T10:00:00.000Z').getDay()).toBe(1)
    expect(resolveWeekStart('2026-09-14T00:00:00.000Z').getDate()).toBe(14)
  })

  it('falls back to the current week on rubbish input', () => {
    expect(resolveWeekStart('not-a-date').getDay()).toBe(1)
    expect(resolveWeekStart(null).getDay()).toBe(1)
  })

  it('labels the range from Monday to Sunday', () => {
    expect(weekRangeLabel(weekStart)).toBe('14 Sep - 20 Sep 2026')
  })
})
