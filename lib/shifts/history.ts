import type { Shift } from '@/types'

export interface ShiftHistorySummary {
  total: number
  workedShifts: number
  absences: number
  hours: number
  firstShift: string | null
  lastShift: string | null
}

const MS_PER_HOUR = 1000 * 60 * 60

/** Totals for an employee's record. Only working shifts count towards hours. */
export function summariseHistory(shifts: Shift[]): ShiftHistorySummary {
  const working = shifts.filter((shift) => shift.type === 'shift')
  const sorted = [...shifts].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  const hours = working.reduce((total, shift) => {
    const span = new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()
    return total + span / MS_PER_HOUR
  }, 0)

  return {
    total: shifts.length,
    workedShifts: working.length,
    absences: shifts.length - working.length,
    hours: Math.round(hours * 10) / 10,
    firstShift: sorted[0]?.startTime ?? null,
    lastShift: sorted[sorted.length - 1]?.startTime ?? null,
  }
}

export interface MonthKey {
  year: number
  month: number
}

/** Months that actually have something, newest first, for the month picker. */
export function monthsWithShifts(shifts: Shift[]): MonthKey[] {
  const seen = new Map<string, MonthKey>()

  for (const shift of shifts) {
    const start = new Date(shift.startTime)
    const end = new Date(shift.endTime)
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)

    // A booking spanning months belongs to each of them.
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}`
      if (!seen.has(key)) seen.set(key, { year: cursor.getFullYear(), month: cursor.getMonth() })
      cursor.setMonth(cursor.getMonth() + 1)
    }
  }

  return [...seen.values()].sort((a, b) => b.year - a.year || b.month - a.month)
}

export function shiftsInMonth(shifts: Shift[], year: number, month: number) {
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 1)

  return shifts.filter((shift) =>
    new Date(shift.startTime) < monthEnd && new Date(shift.endTime) > monthStart
  )
}
