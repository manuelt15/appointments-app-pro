import moment from 'moment-timezone'
import type { Employee, Shift, ShiftType } from '@/types'

export const TYPE_LABELS: Record<ShiftType, string> = {
  shift: 'Shift',
  vacation: 'Vacation',
  sick_leave: 'Sick leave',
  time_off: 'Time off',
}

export interface WeekDayEntry {
  day: Date
  /** "Mon 14", in business time. */
  label: string
  /** "Monday 14 September", in business time. */
  fullLabel: string
  entries: string[]
}

export interface EmployeeWeek {
  employee: Employee
  days: WeekDayEntry[]
  hours: number
  hasAnything: boolean
}

function overlaps(shift: Shift, dayStart: Date, dayEnd: Date) {
  return new Date(shift.startTime) < dayEnd && new Date(shift.endTime) > dayStart
}

/**
 * One row per employee with what they do each day, shared by the PDF and the
 * emails so both always describe the same week. Days run midnight to midnight
 * in the business's time zone, never the server's.
 */
export function buildEmployeeWeeks(
  employees: Employee[],
  shifts: Shift[],
  weekStart: Date,
  timeZone: string
): EmployeeWeek[] {
  const days = Array.from({ length: 7 }, (_, index) => moment(weekStart).tz(timeZone).add(index, 'day'))
  const time = (date: Date) => moment(date).tz(timeZone).format('HH:mm')

  return employees.map((employee) => {
    const own = shifts.filter((shift) => shift.employeeId === employee._id)
    let hours = 0

    const rows = days.map((day) => {
      const dayStart = day.toDate()
      const dayEnd = day.clone().add(1, 'day').toDate()
      const entries: string[] = []

      for (const shift of own) {
        if (!overlaps(shift, dayStart, dayEnd)) continue

        if (shift.type === 'shift') {
          const start = new Date(shift.startTime)
          const end = new Date(shift.endTime)
          const from = start < dayStart ? dayStart : start
          const to = end > dayEnd ? dayEnd : end
          hours += (to.getTime() - from.getTime()) / 3_600_000
          entries.push(`${time(from)} - ${time(to)}`)
        } else {
          entries.push(TYPE_LABELS[shift.type])
        }
      }

      return { day: dayStart, label: day.format('ddd D'), fullLabel: day.format('dddd D MMMM'), entries }
    })

    return {
      employee,
      days: rows,
      hours: Math.round(hours * 10) / 10,
      hasAnything: rows.some((row) => row.entries.length > 0),
    }
  })
}

export function weekRangeLabel(weekStart: Date, timeZone: string) {
  const start = moment(weekStart).tz(timeZone)
  return `${start.format('D MMM')} - ${start.clone().add(6, 'day').format('D MMM YYYY')}`
}

/** Monday 00:00 of the week holding `value`, in the business's time zone. */
export function resolveWeekStart(value: string | null, timeZone: string) {
  const parsed = value ? new Date(value) : new Date()
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  return moment(date).tz(timeZone).startOf('isoWeek').toDate()
}

/** The next Monday 00:00 in business time: not always 168 hours later, because of DST. */
export function weekEnd(weekStart: Date, timeZone: string) {
  return moment(weekStart).tz(timeZone).add(1, 'week').toDate()
}
