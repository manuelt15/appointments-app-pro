'use client'

import { useState } from 'react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getYear,
  isSameDay,
  isSameMonth,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CALENDAR_DATE_FORMAT, parseCalendarDate } from '@/lib/shifts/calendar-date'
import { cn } from '@/lib/utils'

const WEEK_OPTIONS = { weekStartsOn: 1 } as const
const MONTHS = Array.from({ length: 12 }, (_, index) => format(setMonth(new Date(), index), 'MMMM'))

interface Props {
  id?: string
  value: string
  onChange: (value: string) => void
  /** How far back the year list reaches. Birthdays need decades, start dates do not. */
  yearsBack?: number
  yearsForward?: number
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({
  id,
  value,
  onChange,
  yearsBack = 80,
  yearsForward = 1,
  placeholder = 'Pick a date',
  disabled,
}: Props) {
  const selected = parseCalendarDate(value)
  const [open, setOpen] = useState(false)
  const [month, setMonthState] = useState(() => startOfMonth(selected ?? new Date()))

  const thisYear = getYear(new Date())
  const years = Array.from(
    { length: yearsBack + yearsForward + 1 },
    (_, index) => thisYear + yearsForward - index
  )

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTIONS),
  })

  const weekdays = Array.from({ length: 7 }, (_, index) =>
    format(addDays(startOfWeek(new Date(), WEEK_OPTIONS), index), 'EEEEE')
  )

  function handleOpenChange(next: boolean) {
    if (next) setMonthState(startOfMonth(parseCalendarDate(value) ?? new Date()))
    setOpen(next)
  }

  function pick(day: Date) {
    onChange(format(day, CALENDAR_DATE_FORMAT))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-11 w-full justify-between px-3 font-normal sm:h-10"
        >
          <span className={cn(!selected && 'text-body')}>
            {selected ? format(selected, 'd MMMM yyyy') : placeholder}
          </span>
          <CalendarIcon className="size-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex items-center gap-1 pb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonthState((current) => subMonths(current, 1))}
          >
            <ChevronLeft />
          </Button>

          <Select
            value={String(month.getMonth())}
            onValueChange={(next) => setMonthState((current) => setMonth(current, Number(next)))}
          >
            <SelectTrigger aria-label="Month" className="h-8 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {MONTHS.map((name, index) => (
                <SelectItem key={name} value={String(index)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(getYear(month))}
            onValueChange={(next) => setMonthState((current) => setYear(current, Number(next)))}
          >
            <SelectTrigger aria-label="Year" className="h-8 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonthState((current) => addMonths(current, 1))}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-0.5" role="grid">
          {weekdays.map((weekday, index) => (
            <span key={index} role="columnheader" className="grid h-8 place-items-center text-xs text-body">
              {weekday}
            </span>
          ))}
          {days.map((day) => {
            const isSelected = Boolean(selected && isSameDay(day, selected))
            return (
              <button
                key={day.toISOString()}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-label={format(day, 'd MMMM yyyy')}
                onClick={() => pick(day)}
                className={cn(
                  'grid h-8 w-9 place-items-center rounded-sm text-sm transition-colors can-hover:hover:bg-muted',
                  !isSameMonth(day, month) && 'text-body/60',
                  isSelected && 'bg-foreground text-primary-foreground can-hover:hover:bg-foreground'
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>

        {value && (
          <Button type="button" variant="ghost" size="sm" className="mt-2 w-full" onClick={() => { onChange(''); setOpen(false) }}>
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
