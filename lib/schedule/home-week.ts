import moment from 'moment-timezone'
import { TYPE_LABELS } from './week'
import type { Employee, Shift, ShiftType } from '@/types'

export interface HomeDayEntry {
  type: ShiftType
  text: string
}

export interface HomeDay {
  date: string
  label: string
  entries: HomeDayEntry[]
}

export interface HomeEmployeeWeek {
  employee: Employee
  days: HomeDay[]
  hours: number
}

export interface HomeWeek {
  start: Date
  end: Date
  days: { date: string; label: string }[]
  /** Everyone with at least one shift or absence, busiest first. */
  scheduled: HomeEmployeeWeek[]
  /** Active employees with nothing at all this week. */
  unassigned: Employee[]
}

/** Monday to Monday in the business's time zone. */
export function businessWeekRange(now: Date, timeZone: string) {
  const start = moment(now).tz(timeZone).startOf('isoWeek')
  return { start: start.toDate(), end: start.clone().add(1, 'week').toDate() }
}

export function buildHomeWeek(employees: Employee[], shifts: Shift[], now: Date, timeZone: string): HomeWeek {
  const { start, end } = businessWeekRange(now, timeZone)
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = moment(start).tz(timeZone).add(index, 'day')
    return { start: day.toDate(), end: day.clone().add(1, 'day').toDate(), date: day.format('YYYY-MM-DD'), label: day.format('ddd D') }
  })

  const weeks = employees.map((employee) => {
    const own = shifts
      .filter((shift) => shift.employeeId === employee._id)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    let hours = 0

    const rows = days.map((day) => {
      const entries: HomeDayEntry[] = []
      for (const shift of own) {
        const shiftStart = new Date(shift.startTime)
        const shiftEnd = new Date(shift.endTime)
        if (shiftStart >= day.end || shiftEnd <= day.start) continue

        if (shift.type === 'shift') {
          const from = shiftStart < day.start ? day.start : shiftStart
          const to = shiftEnd > day.end ? day.end : shiftEnd
          hours += (to.getTime() - from.getTime()) / 3_600_000
          entries.push({
            type: 'shift',
            text: `${moment(from).tz(timeZone).format('HH:mm')}–${moment(to).tz(timeZone).format('HH:mm')}`,
          })
        } else {
          entries.push({ type: shift.type, text: TYPE_LABELS[shift.type] })
        }
      }
      return { date: day.date, label: day.label, entries }
    })

    return { employee, days: rows, hours: Math.round(hours * 10) / 10 }
  })

  const hasAnything = (week: HomeEmployeeWeek) => week.days.some((day) => day.entries.length > 0)

  return {
    start,
    end,
    days: days.map(({ date, label }) => ({ date, label })),
    scheduled: weeks.filter(hasAnything).sort((a, b) => b.hours - a.hours),
    unassigned: weeks.filter((week) => !hasAnything(week) && week.employee.isActive).map((week) => week.employee),
  }
}
