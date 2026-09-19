'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/** Same wire format as the native datetime-local input it replaces. */
const VALUE_FORMAT = "yyyy-MM-dd'T'HH:mm"
const WEEK_OPTIONS = { weekStartsOn: 1 } as const
const SLOT_MINUTES = 30

interface Props {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function parseValue(value: string) {
  const parsed = parse(value, VALUE_FORMAT, new Date())
  return isValid(parsed) ? parsed : null
}

const TIME_SLOTS = Array.from({ length: (24 * 60) / SLOT_MINUTES }, (_, index) => {
  const minutes = index * SLOT_MINUTES
  return {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
    label: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
  }
})

export function DateTimePicker({ id, value, onChange, disabled }: Props) {
  const selected = parseValue(value)
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => startOfMonth(selected ?? new Date()))
  const timeListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const active = timeListRef.current?.querySelector('[data-selected="true"]')
    active?.scrollIntoView({ block: 'center' })
  }, [open])

  const days = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTIONS),
  }), [month])

  const weekdays = useMemo(() => {
    const first = startOfWeek(new Date(), WEEK_OPTIONS)
    return Array.from({ length: 7 }, (_, index) => format(addDays(first, index), 'EEEEE'))
  }, [])

  // Opening is an event, not an effect: land on the month the value points at.
  function handleOpenChange(next: boolean) {
    if (next) setMonth(startOfMonth(parseValue(value) ?? new Date()))
    setOpen(next)
  }

  function commit(date: Date) {
    onChange(format(date, VALUE_FORMAT))
  }

  function pickDay(day: Date) {
    const base = selected ?? new Date()
    const next = new Date(day)
    next.setHours(base.getHours(), base.getMinutes(), 0, 0)
    commit(next)
  }

  function pickTime(hours: number, minutes: number) {
    const next = new Date(selected ?? month)
    next.setHours(hours, minutes, 0, 0)
    commit(next)
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
            {selected ? format(selected, 'd MMM yyyy, HH:mm') : 'Pick a date and time'}
          </span>
          <CalendarIcon className="size-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0">
        <div className="p-3">
          <div className="flex items-center justify-between gap-2 pb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Previous month"
              onClick={() => setMonth((current) => subMonths(current, 1))}
            >
              <ChevronLeft />
            </Button>
            <span aria-live="polite" className="text-sm font-medium">{format(month, 'MMMM yyyy')}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Next month"
              onClick={() => setMonth((current) => addMonths(current, 1))}
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
              const isToday = isSameDay(day, new Date())
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-label={format(day, 'd MMMM yyyy')}
                  onClick={() => pickDay(day)}
                  className={cn(
                    'grid h-8 w-9 place-items-center rounded-sm text-sm transition-colors can-hover:hover:bg-muted',
                    !isSameMonth(day, month) && 'text-body/60',
                    isToday && !isSelected && 'font-semibold text-foreground',
                    isSelected && 'bg-foreground text-primary-foreground can-hover:hover:bg-foreground'
                  )}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </div>

        <div
          ref={timeListRef}
          className="max-h-64 w-full overflow-y-auto p-2 sm:w-32"
          role="listbox"
          aria-label="Time"
        >
          {TIME_SLOTS.map((slot) => {
            const isSelected = Boolean(
              selected && selected.getHours() === slot.hours && selected.getMinutes() === slot.minutes
            )
            return (
              <button
                key={slot.label}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected}
                onClick={() => pickTime(slot.hours, slot.minutes)}
                className={cn(
                  'w-full rounded-sm px-3 py-1.5 text-left font-mono text-sm transition-colors can-hover:hover:bg-muted',
                  isSelected && 'bg-foreground text-primary-foreground can-hover:hover:bg-foreground'
                )}
              >
                {slot.label}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
