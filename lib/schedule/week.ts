import moment from 'moment-timezone'
import type { Employee, Shift } from '@/types'
import { formatInZone } from '@/lib/i18n/dates'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales'
import { t } from '@/lib/i18n/translate'
import { shiftTypeKey } from '@/lib/shifts/labels'

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
  timeZone: string,
  /**
   * El PDF y el correo del cuadrante le pasan el idioma de la sesión. Sin locale
   * se usa el idioma por defecto de la app, el mismo que resuelve `requestLocale`
   * cuando la llamada no trae cookie (cron o tarea interna): español.
   */
  locale: Locale = DEFAULT_LOCALE
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
          entries.push(t(locale, shiftTypeKey(shift.type)))
        }
      }

      return {
        day: dayStart,
        label: formatInZone(dayStart, timeZone, 'EEE d', locale),
        fullLabel: formatInZone(dayStart, timeZone, 'EEEE d MMMM', locale),
        entries,
      }
    })

    return {
      employee,
      days: rows,
      hours: Math.round(hours * 10) / 10,
      hasAnything: rows.some((row) => row.entries.length > 0),
    }
  })
}

export function weekRangeLabel(weekStart: Date, timeZone: string, locale: Locale = DEFAULT_LOCALE) {
  const end = moment(weekStart).tz(timeZone).add(6, 'day').toDate()
  return `${formatInZone(weekStart, timeZone, 'd MMM', locale)} - ${formatInZone(end, timeZone, 'd MMM yyyy', locale)}`
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
