import moment from 'moment-timezone'
import type { Shift } from '@/types'

export interface TimeRange {
  start: Date
  end: Date
}

export interface MonthOverview {
  month: number
  hours: number
  workedShifts: number
  employees: number
  absences: number
}

export interface EmployeeMonthRow {
  employeeId: string
  workedShifts: number
  hours: number
  daysWorked: number
  absences: number
}

const MS_PER_HOUR = 1000 * 60 * 60

/** A calendar month in the business's time zone, not the browser's. */
export function businessMonthRange(year: number, month: number, timeZone: string): TimeRange {
  const start = moment.tz({ year, month, day: 1 }, timeZone)
  return { start: start.toDate(), end: start.clone().add(1, 'month').toDate() }
}

export function businessYearRange(year: number, timeZone: string): TimeRange {
  const start = moment.tz({ year, month: 0, day: 1 }, timeZone)
  return { start: start.toDate(), end: start.clone().add(1, 'year').toDate() }
}

export function shiftsInRange(shifts: Shift[], range: TimeRange) {
  return shifts.filter((shift) =>
    new Date(shift.startTime) < range.end && new Date(shift.endTime) > range.start
  )
}

/** Hours inside the range only, so a night shift across months is not counted twice. */
function hoursInRange(shift: Shift, range: TimeRange) {
  const start = Math.max(new Date(shift.startTime).getTime(), range.start.getTime())
  const end = Math.min(new Date(shift.endTime).getTime(), range.end.getTime())
  return Math.max(0, end - start) / MS_PER_HOUR
}

function round(hours: number) {
  return Math.round(hours * 10) / 10
}

/** Per-employee totals for one month. Only working shifts count towards hours and days. */
export function summariseEmployeesInRange(shifts: Shift[], range: TimeRange, timeZone: string): EmployeeMonthRow[] {
  const rows = new Map<string, EmployeeMonthRow & { days: Set<string> }>()

  for (const shift of shiftsInRange(shifts, range)) {
    let row = rows.get(shift.employeeId)
    if (!row) {
      row = { employeeId: shift.employeeId, workedShifts: 0, hours: 0, daysWorked: 0, absences: 0, days: new Set() }
      rows.set(shift.employeeId, row)
    }

    if (shift.type === 'shift') {
      row.workedShifts += 1
      row.hours += hoursInRange(shift, range)
      row.days.add(moment(shift.startTime).tz(timeZone).format('YYYY-MM-DD'))
    } else {
      row.absences += 1
    }
  }

  return [...rows.values()]
    .map(({ days, ...row }) => ({ ...row, hours: round(row.hours), daysWorked: days.size }))
    .sort((a, b) => b.hours - a.hours || b.absences - a.absences)
}

/** One entry per month of the year, for the month-by-month overview. */
export function summariseYear(shifts: Shift[], year: number, timeZone: string): MonthOverview[] {
  return Array.from({ length: 12 }, (_, month) => {
    const rows = summariseEmployeesInRange(shifts, businessMonthRange(year, month, timeZone), timeZone)
    return {
      month,
      hours: round(rows.reduce((total, row) => total + row.hours, 0)),
      workedShifts: rows.reduce((total, row) => total + row.workedShifts, 0),
      employees: rows.filter((row) => row.workedShifts > 0).length,
      absences: rows.reduce((total, row) => total + row.absences, 0),
    }
  })
}

export function shiftHoursInRange(shift: Shift, range: TimeRange) {
  return round(hoursInRange(shift, range))
}
