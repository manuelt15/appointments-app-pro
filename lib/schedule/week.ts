import { addDays, format, startOfWeek } from 'date-fns'
import type { Employee, Shift, ShiftType } from '@/types'

export const WEEK_OPTIONS = { weekStartsOn: 1 } as const

export const TYPE_LABELS: Record<ShiftType, string> = {
  shift: 'Shift',
  vacation: 'Vacation',
  sick_leave: 'Sick leave',
  time_off: 'Time off',
}

export interface WeekDayEntry {
  day: Date
  label: string
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
 * emails so both always describe the same week.
 */
export function buildEmployeeWeeks(
  employees: Employee[],
  shifts: Shift[],
  weekStart: Date
): EmployeeWeek[] {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

  return employees.map((employee) => {
    const own = shifts.filter((shift) => shift.employeeId === employee._id)
    let hours = 0

    const rows = days.map((day) => {
      const dayStart = day
      const dayEnd = addDays(day, 1)
      const entries: string[] = []

      for (const shift of own) {
        if (!overlaps(shift, dayStart, dayEnd)) continue

        if (shift.type === 'shift') {
          const start = new Date(shift.startTime)
          const end = new Date(shift.endTime)
          const from = start < dayStart ? dayStart : start
          const to = end > dayEnd ? dayEnd : end
          hours += (to.getTime() - from.getTime()) / 3_600_000
          entries.push(`${format(from, 'HH:mm')} - ${format(to, 'HH:mm')}`)
        } else {
          entries.push(TYPE_LABELS[shift.type])
        }
      }

      return { day, label: format(day, 'EEE d'), entries }
    })

    return {
      employee,
      days: rows,
      hours: Math.round(hours * 10) / 10,
      hasAnything: rows.some((row) => row.entries.length > 0),
    }
  })
}

export function weekRangeLabel(weekStart: Date) {
  return `${format(weekStart, 'd MMM')} - ${format(addDays(weekStart, 6), 'd MMM yyyy')}`
}

export function resolveWeekStart(value: string | null) {
  const parsed = value ? new Date(value) : new Date()
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  return startOfWeek(date, WEEK_OPTIONS)
}
