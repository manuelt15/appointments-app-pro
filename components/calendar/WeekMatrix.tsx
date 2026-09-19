'use client'

import { addDays, format, isSameDay, isToday, isWeekend, startOfWeek } from 'date-fns'
import { Cake } from 'lucide-react'
import { isBirthday } from '@/lib/shifts/calendar-date'
import { clampToDay, hoursInRange, overlapsDay } from '@/lib/shifts/matrix'
import { cn } from '@/lib/utils'
import type { Employee, Shift, ShiftType } from '@/types'

const WEEK_OPTIONS = { weekStartsOn: 1 } as const

const TYPE_LABELS: Record<ShiftType, string> = {
  shift: 'Shift',
  vacation: 'Vacation',
  sick_leave: 'Sick leave',
  time_off: 'Time off',
}

/** Diagonal hatching reads as "not available" without competing with shift colors. */
const ABSENCE_BACKGROUND =
  'repeating-linear-gradient(45deg, color-mix(in oklch, var(--faint) 30%, transparent) 0 3px, transparent 3px 9px)'

export interface MatrixShift {
  shift: Shift
  start: Date
  end: Date
}

interface Props {
  date: Date
  employees: Employee[]
  shifts: MatrixShift[]
  onSelectShift: (shift: Shift) => void
  onSelectCell: (employeeId: string, day: Date) => void
}

export default function WeekMatrix({ date, employees, shifts, onSelectShift, onSelectCell }: Props) {
  const weekStart = startOfWeek(date, WEEK_OPTIONS)
  const weekEnd = addDays(weekStart, 7)
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

  if (employees.length === 0) {
    return (
      <div className="grid h-full place-items-center p-6 text-center text-sm text-body">
        <p>No employees yet. Add your team to start planning shifts.</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-20 w-40 min-w-40 border-b border-r bg-card p-2 text-left font-medium">
              Team
            </th>
            {days.map((day) => (
              <th
                key={day.toISOString()}
                className={cn(
                  'sticky top-0 z-10 min-w-32 border-b p-2 font-medium',
                  isWeekend(day) ? 'bg-muted/40' : 'bg-card',
                  isToday(day) && 'text-foreground'
                )}
              >
                <span className="block text-xs text-body">{format(day, 'EEE')}</span>
                <span className={cn(
                  'mt-0.5 inline-grid size-7 place-items-center rounded-full',
                  isToday(day) && 'bg-foreground text-primary-foreground'
                )}>
                  {format(day, 'd')}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => {
            const weeklyHours = hoursInRange(
              shifts.filter((item) => item.shift.employeeId === employee._id && item.shift.type === 'shift'),
              weekStart,
              weekEnd
            )

            return (
            <tr key={employee._id}>
              <th scope="row" className="sticky left-0 z-10 border-b border-r bg-card p-2 text-left align-top font-normal">
                <span className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: employee.color }} aria-hidden="true" />
                    <span className="truncate font-medium">{employee.fullName}</span>
                  </span>
                  <span
                    className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-body"
                    title={`${weeklyHours} scheduled hours this week`}
                  >
                    {weeklyHours}h
                  </span>
                </span>
              </th>
              {days.map((day) => {
                const cellItems = shifts.filter(
                  (item) => item.shift.employeeId === employee._id && overlapsDay(item, day)
                )
                const birthday = isBirthday(employee.birthday, day)
                const absence = cellItems.find((item) => item.shift.type !== 'shift')
                const working = cellItems.filter((item) => item.shift.type === 'shift')
                // Label once, on the first visible day, so a range reads as one bar.
                const labelAbsence = absence
                  && (isSameDay(absence.start, day) || isSameDay(day, weekStart))

                return (
                  <td
                    key={day.toISOString()}
                    className={cn(
                      'border-b p-1 align-top',
                      isWeekend(day) && 'bg-muted/40',
                      birthday && 'bg-birthday/15'
                    )}
                    style={absence ? { backgroundImage: ABSENCE_BACKGROUND } : undefined}
                  >
                    <div className="flex min-h-16 flex-col gap-1">
                      {birthday && (
                        <span
                          className="flex items-center gap-1 rounded-sm bg-birthday/20 px-2 py-1 text-xs font-medium text-birthday-foreground"
                          title={`${employee.fullName} turns a year older today`}
                        >
                          <Cake className="size-3 shrink-0" aria-hidden="true" />
                          Birthday
                        </span>
                      )}
                      {absence && (
                        <button
                          type="button"
                          onClick={() => onSelectShift(absence.shift)}
                          aria-label={`${TYPE_LABELS[absence.shift.type]} for ${employee.fullName} on ${format(day, 'd MMMM')}`}
                          className={cn(
                            'w-full rounded-sm px-2 py-1.5 text-left text-xs transition-colors can-hover:hover:bg-muted',
                            labelAbsence ? 'font-medium text-body' : 'min-h-8'
                          )}
                        >
                          {labelAbsence ? TYPE_LABELS[absence.shift.type] : ''}
                        </button>
                      )}

                      {working.map((item) => {
                        const span = clampToDay(item, day)
                        return (
                          <button
                            key={item.shift._id}
                            type="button"
                            onClick={() => onSelectShift(item.shift)}
                            className="w-full rounded-sm px-2 py-1.5 text-left text-xs text-primary-foreground transition-opacity can-hover:hover:opacity-90"
                            style={{ backgroundColor: employee.color }}
                          >
                            <span className="block font-medium">
                              {span.continuesBefore && '… '}
                              {format(span.start, 'HH:mm')} – {format(span.end, 'HH:mm')}
                              {span.continuesAfter && ' …'}
                            </span>
                            {item.shift.notes && <span className="block truncate opacity-90">{item.shift.notes}</span>}
                          </button>
                        )
                      })}

                      {!absence && (
                        <button
                          type="button"
                          aria-label={`Add a shift for ${employee.fullName} on ${format(day, 'd MMMM')}`}
                          onClick={() => onSelectCell(employee._id, day)}
                          className="flex-1 rounded-sm border border-dashed border-transparent text-xs text-body transition-colors can-hover:hover:border-border can-hover:hover:bg-muted"
                        >
                          {working.length === 0 ? '+' : ''}
                        </button>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
