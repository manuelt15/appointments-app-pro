import { addDays, endOfDay, getYear, startOfDay } from 'date-fns'
import type { Shift } from '@/types'

/** Spanish statutory minimum: 30 calendar days a year. */
export const ANNUAL_VACATION_DAYS = 30

export interface VacationBalance {
  allowance: number
  taken: number
  remaining: number
}

/**
 * Calendar days touched by vacation inside a year. A booking ending exactly at
 * midnight does not claim the following day.
 */
export function vacationDaysTaken(shifts: Shift[], year: number) {
  const days = new Set<string>()

  for (const shift of shifts) {
    if (shift.type !== 'vacation') continue

    const start = new Date(shift.startTime)
    const end = new Date(shift.endTime)

    for (let day = startOfDay(start); day < end; day = addDays(day, 1)) {
      if (getYear(day) !== year) continue
      if (end <= startOfDay(day)) break
      days.add(day.toDateString())
    }
  }

  return days.size
}

export function vacationBalance(
  shifts: Shift[],
  year: number,
  allowance = ANNUAL_VACATION_DAYS
): VacationBalance {
  const taken = vacationDaysTaken(shifts, year)
  return { allowance, taken, remaining: Math.max(allowance - taken, 0) }
}

/** Days of vacation falling inside one month, for the monthly breakdown. */
export function vacationDaysInMonth(shifts: Shift[], year: number, month: number) {
  const days = new Set<string>()

  for (const shift of shifts) {
    if (shift.type !== 'vacation') continue

    const start = new Date(shift.startTime)
    const end = new Date(shift.endTime)

    for (let day = startOfDay(start); day < end; day = addDays(day, 1)) {
      if (getYear(day) !== year || day.getMonth() !== month) continue
      if (end <= startOfDay(day)) break
      if (endOfDay(day) < start) continue
      days.add(day.toDateString())
    }
  }

  return days.size
}
