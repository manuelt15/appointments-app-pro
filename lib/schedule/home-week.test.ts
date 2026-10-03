import { describe, expect, it } from 'vitest'
import { buildHomeWeek, businessWeekRange } from './home-week'
import type { Employee, Shift } from '@/types'

const MADRID = 'Europe/Madrid'
// Saturday 3 Oct 2026, 12:00 in Madrid
const NOW = new Date('2026-10-03T10:00:00.000Z')

function employee(id: string, partial: Partial<Employee> = {}): Employee {
  return { _id: id, businessId: 'b', fullName: id, color: '#000000', isActive: true, createdAt: '', ...partial }
}

function shift(partial: Partial<Shift>): Shift {
  return {
    _id: Math.random().toString(36).slice(2),
    businessId: 'b',
    employeeId: 'ana',
    startTime: '2026-09-28T07:00:00.000Z',
    endTime: '2026-09-28T15:00:00.000Z',
    type: 'shift',
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('business week range', () => {
  it('starts on Monday at midnight in the business time zone', () => {
    const range = businessWeekRange(NOW, MADRID)
    expect(range.start.toISOString()).toBe('2026-09-27T22:00:00.000Z')
    expect(range.end.toISOString()).toBe('2026-10-04T22:00:00.000Z')
  })
})

describe('home week', () => {
  it('shows business-time hours per day and totals', () => {
    const week = buildHomeWeek([employee('ana')], [
      shift({}),
      shift({ startTime: '2026-09-29T07:00:00.000Z', endTime: '2026-09-29T11:00:00.000Z' }),
    ], NOW, MADRID)

    expect(week.days.map((day) => day.label)).toEqual(['Mon 28', 'Tue 29', 'Wed 30', 'Thu 1', 'Fri 2', 'Sat 3', 'Sun 4'])
    expect(week.scheduled[0].hours).toBe(12)
    expect(week.scheduled[0].days[0].entries).toEqual([{ type: 'shift', text: '09:00–17:00' }])
    expect(week.scheduled[0].days[1].entries).toEqual([{ type: 'shift', text: '09:00–13:00' }])
  })

  it('counts absences as scheduled and lists them by day', () => {
    const week = buildHomeWeek([employee('ana')], [
      shift({ type: 'vacation', startTime: '2026-09-27T22:00:00.000Z', endTime: '2026-09-29T22:00:00.000Z' }),
    ], NOW, MADRID)

    expect(week.unassigned).toEqual([])
    expect(week.scheduled[0].hours).toBe(0)
    expect(week.scheduled[0].days.slice(0, 3).map((day) => day.entries.map((entry) => entry.text))).toEqual([
      ['Vacation'], ['Vacation'], [],
    ])
  })

  it('flags active employees with nothing this week, ignoring inactive ones', () => {
    const week = buildHomeWeek(
      [employee('ana'), employee('bea'), employee('old', { isActive: false })],
      [shift({}), shift({ employeeId: 'bea', startTime: '2026-09-20T07:00:00.000Z', endTime: '2026-09-20T15:00:00.000Z' })],
      NOW,
      MADRID
    )

    expect(week.scheduled.map((row) => row.employee._id)).toEqual(['ana'])
    expect(week.unassigned.map((row) => row._id)).toEqual(['bea'])
  })

  it('splits a night shift across the two days it touches', () => {
    const week = buildHomeWeek([employee('ana')], [
      shift({ startTime: '2026-09-29T20:00:00.000Z', endTime: '2026-09-30T04:00:00.000Z' }),
    ], NOW, MADRID)

    expect(week.scheduled[0].days[1].entries[0].text).toBe('22:00–00:00')
    expect(week.scheduled[0].days[2].entries[0].text).toBe('00:00–06:00')
    expect(week.scheduled[0].hours).toBe(8)
  })
})
