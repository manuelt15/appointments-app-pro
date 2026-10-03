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
  isSameWeek,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const WEEK_OPTIONS = { weekStartsOn: 1 } as const
const MONTHS = Array.from({ length: 12 }, (_, index) => format(setMonth(new Date(), index), 'MMMM'))
const YEARS_BACK = 10
const YEARS_FORWARD = 2

interface Props {
  date: Date
  today: Date
  label: string
  onSelect: (date: Date) => void
}

/** The toolbar's range label, opening a month grid to jump straight to any week. */
export default function WeekPicker({ date, today, label, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [month, setMonthState] = useState(() => startOfMonth(date))

  const thisYear = getYear(today)
  const years = Array.from({ length: YEARS_BACK + YEARS_FORWARD + 1 }, (_, index) => thisYear + YEARS_FORWARD - index)

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTIONS),
  })
  const weeks = Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7))

  const weekdays = Array.from({ length: 7 }, (_, index) =>
    format(addDays(startOfWeek(today, WEEK_OPTIONS), index), 'EEEEE')
  )

  function handleOpenChange(next: boolean) {
    if (next) setMonthState(startOfMonth(date))
    setOpen(next)
  }

  function pick(day: Date) {
    onSelect(day)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" className="ml-1 gap-1.5 px-2 font-medium" aria-label={`Pick a week, showing ${label}`}>
          <span aria-live="polite">{label}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
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

        <div role="grid" aria-label="Weeks">
          <div role="row" className="grid grid-cols-7 gap-0.5">
            {weekdays.map((weekday, index) => (
              <span key={index} role="columnheader" className="grid h-8 place-items-center text-xs text-body">
                {weekday}
              </span>
            ))}
          </div>
          {weeks.map((week) => {
            const selected = isSameWeek(week[0], date, WEEK_OPTIONS)
            return (
              <div
                key={week[0].toISOString()}
                role="row"
                aria-selected={selected}
                className={cn(
                  'grid grid-cols-7 gap-0.5 rounded-sm transition-colors',
                  selected ? 'bg-foreground text-primary-foreground' : 'can-hover:hover:bg-muted'
                )}
              >
                {week.map((day) => (
                  <button
                    key={day.toISOString()}
                    type="button"
                    role="gridcell"
                    aria-label={format(day, 'd MMMM yyyy')}
                    onClick={() => pick(day)}
                    className={cn(
                      'grid h-8 w-9 place-items-center rounded-sm text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
                      !isSameMonth(day, month) && !selected && 'text-body/60',
                      isSameDay(day, today) && 'font-semibold underline underline-offset-4'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
