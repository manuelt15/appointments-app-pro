'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, momentLocalizer, Views, type View } from 'react-big-calendar'
import withDragAndDrop, { type EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop'
import { addDays, addMonths, addWeeks, format, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, FileDown, Mail } from 'lucide-react'
import moment from 'moment-timezone'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { toast } from 'sonner'
import ShiftModal from './ShiftModal'
import WeekMatrix, { type MatrixShift } from './WeekMatrix'
import WeekPicker from './WeekPicker'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { readableForeground } from '@/lib/design/readable-foreground'
import { calendarDateToIso, getCalendarLoadRange, toCalendarDate } from '@/lib/datetime/timezone'
import { useLocale } from '@/lib/i18n/client'
import { dateFnsLocale } from '@/lib/i18n/dates'
import { t as translate } from '@/lib/i18n/translate'
import { shiftTypeKey } from '@/lib/shifts/labels'
import { collectPaginatedResults } from '@/lib/shifts/pagination'
import { cn } from '@/lib/utils'
import type { Employee, Shift } from '@/types'

const localizer = momentLocalizer(moment)
const WEEK_OPTIONS = { weekStartsOn: 1 } as const
const DEFAULT_SHIFT_HOURS = 8
const DEFAULT_SHIFT_START = 9

/** 24-hour clock everywhere: these schedules are not US-facing. */
const CALENDAR_FORMATS = {
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${moment(start).format('HH:mm')} – ${moment(end).format('HH:mm')}`,
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Shift
  employeeId: string
  color: string
}

interface Props {
  timeZone: string
}

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar)

function newShiftSlot(timeZone: string) {
  const start = toCalendarDate(new Date(), timeZone)
  start.setHours(DEFAULT_SHIFT_START, 0, 0, 0)
  return { start, end: new Date(start.getTime() + DEFAULT_SHIFT_HOURS * 3600 * 1000) }
}

export default function ShiftCalendar({ timeZone }: Props) {
  const { locale, t } = useLocale()
  const [view, setView] = useState<View>(Views.WEEK)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [date, setDate] = useState(() => toCalendarDate(new Date(), timeZone))
  const [modal, setModal] = useState<{ shift?: Shift; start?: Date; end?: Date; employeeId?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  // Which range the events on screen belong to. A reload after saving keeps the grid in place;
  // only a range that has never loaded (first visit, another week) shows the loading state.
  const [loadedRange, setLoadedRange] = useState('')
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // The sidebar's "New shift" button links here with ?new=shift.
  const newShiftRequested = searchParams.get('new') === 'shift'
  const [newShiftHandled, setNewShiftHandled] = useState(false)
  if (newShiftRequested !== newShiftHandled) {
    setNewShiftHandled(newShiftRequested)
    if (newShiftRequested) setModal(newShiftSlot(timeZone))
  }

  useEffect(() => {
    if (newShiftRequested) router.replace('/dashboard', { scroll: false })
  }, [newShiftRequested, router])

  // The load range is the whole month plus a week each side, so moving between weeks of the
  // same month needs no request and no loading state.
  const { start: rangeStart, end: rangeEnd } = getCalendarLoadRange(date, timeZone)
  const rangeKey = `${rangeStart}|${rangeEnd}`

  useEffect(() => {
    const controller = new AbortController()
    const requestedRange = `${rangeStart}|${rangeEnd}`

    async function loadSchedule() {
      setLoading(true)
      setError('')

      try {
        const [shifts, employeeResponse] = await Promise.all([
          collectPaginatedResults<Shift>(async (page) => {
            const query = new URLSearchParams({
              start: rangeStart,
              end: rangeEnd,
              limit: '200',
              page: String(page),
            })
            const response = await fetch(`/api/shifts?${query}`, { signal: controller.signal })
            if (!response.ok) throw new Error('Could not load shifts')
            return response.json()
          }),
          fetch('/api/employees', { signal: controller.signal }).then((response) => {
            if (!response.ok) throw new Error('Could not load employees')
            return response.json()
          }),
        ])

        const team: Employee[] = employeeResponse.data ?? []
        const colorById = Object.fromEntries(team.map((employee) => [employee._id, employee.color]))

        setEmployees(team)
        setEvents(shifts.map((shift) => ({
          id: shift._id,
          title: shift.type === 'shift'
            ? (shift.notes || translate(locale, 'shifts.type.shift'))
            : translate(locale, shiftTypeKey(shift.type)),
          start: toCalendarDate(shift.startTime, timeZone),
          end: toCalendarDate(shift.endTime, timeZone),
          resource: shift,
          employeeId: shift.employeeId,
          color: shift.type === 'shift'
            ? (colorById[shift.employeeId] ?? 'var(--foreground)')
            : 'var(--faint)',
        })))
        setLoadedRange(requestedRange)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(translate(locale, 'calendar.loadError'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadSchedule()
    return () => controller.abort()
  }, [rangeStart, rangeEnd, refreshKey, timeZone, locale])

  async function handleEventDrop({ event, start, end }: EventInteractionArgs<CalendarEvent>) {
    try {
      const response = await fetch(`/api/shifts/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: calendarDateToIso(new Date(start), timeZone),
          endTime: calendarDateToIso(new Date(end), timeZone),
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? t('calendar.moveError'))
      }

      toast.success(t('calendar.shiftMoved'))
      setRefreshKey((key) => key + 1)
    } catch (moveError) {
      toast.error(moveError instanceof Error ? moveError.message : t('calendar.moveError'))
    }
  }

  function shiftDate(direction: -1 | 1) {
    setDate((current) => {
      return view === Views.MONTH ? addMonths(current, direction) : addWeeks(current, direction)
    })
  }

  function visibleWeekStart() {
    return startOfWeek(date, WEEK_OPTIONS).toISOString()
  }

  async function emailSchedule() {
    setSending(true)
    try {
      const response = await fetch('/api/schedule/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: visibleWeekStart() }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? t('calendar.sendError'))

      const { sent, prepared, skipped, configured } = data.data
      if (!configured) {
        toast.message(
          prepared === 0
            ? t('calendar.nothingToSend')
            : t(prepared === 1 ? 'calendar.emailsReadyOne' : 'calendar.emailsReadyMany', { count: prepared }),
          {
            description: prepared === 0
              ? skipped.map((item: { employeeName: string; reason: string }) => `${item.employeeName}: ${item.reason}`).join(', ')
              : t('calendar.noProviderBody'),
          }
        )
        return
      }

      toast.success(t(sent === 1 ? 'calendar.emailsSentOne' : 'calendar.emailsSentMany', { count: sent }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('calendar.sendError'))
    } finally {
      setSending(false)
    }
  }

  async function downloadPdf() {
    setDownloading(true)
    try {
      const response = await fetch(`/api/schedule/pdf?week=${encodeURIComponent(visibleWeekStart())}`)
      if (!response.ok) throw new Error(t('calendar.pdfError'))

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `schedule-${visibleWeekStart().slice(0, 10)}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('calendar.pdfError'))
    } finally {
      setDownloading(false)
    }
  }

  function openCell(employeeId: string, day: Date) {
    const start = new Date(day)
    start.setHours(DEFAULT_SHIFT_START, 0, 0, 0)
    setModal({
      employeeId,
      start,
      end: new Date(start.getTime() + DEFAULT_SHIFT_HOURS * 3600 * 1000),
    })
  }

  const localeNames = dateFnsLocale(locale)
  const rangeLabel = view === Views.MONTH
    ? format(date, 'MMMM yyyy', { locale: localeNames })
    : `${format(startOfWeek(date, WEEK_OPTIONS), 'd MMM', { locale: localeNames })} – ${format(addDays(startOfWeek(date, WEEK_OPTIONS), 6), 'd MMM yyyy', { locale: localeNames })}`

  const matrixShifts: MatrixShift[] = events.map((event) => ({
    shift: event.resource,
    start: event.start,
    end: event.end,
  }))

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" aria-label={view === Views.MONTH ? t('calendar.previousMonth') : t('calendar.previousWeek')} onClick={() => shiftDate(-1)}>
            <ChevronLeft />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label={view === Views.MONTH ? t('calendar.nextMonth') : t('calendar.nextWeek')} onClick={() => shiftDate(1)}>
            <ChevronRight />
          </Button>
          <Button type="button" variant="outline" onClick={() => setDate(toCalendarDate(new Date(), timeZone))}>
            {t('calendar.today')}
          </Button>
          <WeekPicker date={date} today={toCalendarDate(new Date(), timeZone)} label={rangeLabel} onSelect={setDate} />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-sm border p-0.5" role="group" aria-label={t('calendar.viewGroup')}>
            {([Views.MONTH, Views.WEEK] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={cn(
                  'rounded-[3px] px-3 py-1.5 text-sm transition-colors',
                  view === option ? 'bg-foreground text-primary-foreground' : 'text-body can-hover:hover:bg-muted'
                )}
              >
                {t(option === Views.MONTH ? 'calendar.viewMonth' : 'calendar.viewWeek')}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={emailSchedule}
            disabled={sending}
            aria-label={t('calendar.emailSchedule')}
            title={t('calendar.emailSchedule')}
          >
            <Mail />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={downloadPdf}
            disabled={downloading}
            aria-label={t('calendar.downloadPdf')}
            title={t('calendar.downloadPdf')}
          >
            <FileDown />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card p-2 shadow-[0_1px_1px_rgb(0_0_0/0.04)]">
        {loading && loadedRange !== rangeKey ? (
          <div className="grid h-full place-items-center"><LoadingState label={t('calendar.loading')} /></div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-body" role="alert">
            <p>{error}</p>
            <Button variant="outline" onClick={() => setRefreshKey((key) => key + 1)}>{t('calendar.tryAgain')}</Button>
          </div>
        ) : view === Views.WEEK ? (
          <WeekMatrix
            date={date}
            employees={employees}
            shifts={matrixShifts}
            onSelectShift={(shift) => setModal({ shift })}
            onSelectCell={openCell}
          />
        ) : (
          <DnDCalendar
            localizer={localizer}
            formats={CALENDAR_FORMATS}
            toolbar={false}
            views={[Views.MONTH]}
            events={events}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            onSelectSlot={({ start, end }) => setModal({ start, end })}
            onSelectEvent={(event) => setModal({ shift: event.resource })}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventDrop}
            selectable
            resizable
            style={{ height: '100%' }}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.color,
                borderRadius: '6px',
                border: 'none',
                color: readableForeground(event.color),
                fontSize: '12px',
              },
            })}
          />
        )}
      </div>

      {modal && (
        <ShiftModal
          shift={modal.shift}
          defaultStart={modal.start}
          defaultEnd={modal.end}
          defaultEmployeeId={modal.employeeId}
          timeZone={timeZone}
          onClose={() => setModal(null)}
          onSaved={() => setRefreshKey((key) => key + 1)}
        />
      )}
    </div>
  )
}
