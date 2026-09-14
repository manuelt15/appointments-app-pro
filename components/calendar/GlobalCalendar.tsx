'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Calendar, momentLocalizer, Views, type View } from 'react-big-calendar'
import withDragAndDrop, { type EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop'
import { Plus } from 'lucide-react'
import moment from 'moment-timezone'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { toast } from 'sonner'
import AppointmentModal from './AppointmentModal'
import { Button } from '@/components/ui/button'
import { collectPaginatedResults } from '@/lib/appointments/pagination'
import { calendarDateToIso, getCalendarLoadRange, toCalendarDate } from '@/lib/datetime/timezone'
import type { Appointment } from '@/types'

const localizer = momentLocalizer(moment)
const MOBILE_QUERY = '(max-width: 640px)'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Appointment
  color?: string
}

interface Props {
  timeZone: string
}

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar)

function subscribeToMobileQuery(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches
}

export default function GlobalCalendar({ timeZone }: Props) {
  const isMobile = useSyncExternalStore(subscribeToMobileQuery, getMobileSnapshot, () => false)
  const [selectedView, setSelectedView] = useState<View | null>(null)
  const view = selectedView ?? (isMobile ? Views.AGENDA : Views.WEEK)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [date, setDate] = useState(() => toCalendarDate(new Date(), timeZone))
  const [modal, setModal] = useState<{ appointment?: Appointment; start?: Date; end?: Date } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadAppointments() {
      setLoading(true)
      setError('')

      try {
        const range = getCalendarLoadRange(date, timeZone)
        const items = await collectPaginatedResults<Appointment>(async (page) => {
          const query = new URLSearchParams({
            start: range.start,
            end: range.end,
            limit: '200',
            page: String(page),
          })
          const response = await fetch(`/api/appointments?${query}`, { signal: controller.signal })
          if (!response.ok) throw new Error('Could not load appointments')
          return response.json()
        })

        setEvents(items.map((appointment) => ({
          id: appointment._id,
          title: `${appointment.status === 'cancelled' ? '[Cancelled] ' : ''}${appointment.title} – ${appointment.clientName}`,
          start: toCalendarDate(appointment.startTime, timeZone),
          end: toCalendarDate(appointment.endTime, timeZone),
          resource: appointment,
          color: appointment.status === 'cancelled' ? 'var(--faint)' : undefined,
        })))
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError('Appointments could not be loaded.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadAppointments()
    return () => controller.abort()
  }, [date, refreshKey, timeZone])

  async function handleEventDrop({ event, start, end }: EventInteractionArgs<CalendarEvent>) {
    try {
      const response = await fetch(`/api/appointments/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: calendarDateToIso(new Date(start), timeZone),
          endTime: calendarDateToIso(new Date(end), timeZone),
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Could not move appointment')
      }

      toast.success('Appointment moved')
      setRefreshKey((key) => key + 1)
    } catch (moveError) {
      toast.error(moveError instanceof Error ? moveError.message : 'Could not move appointment')
    }
  }

  function openNewAppointment() {
    const start = toCalendarDate(new Date(), timeZone)
    const end = new Date(start.getTime() + 30 * 60 * 1000)
    setModal({ start, end })
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-body" role="status">Loading appointments…</div>
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-body" role="alert">
        <p>{error}</p>
        <Button variant="outline" onClick={() => setRefreshKey((key) => key + 1)}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex justify-end">
        <Button type="button" onClick={openNewAppointment} className="w-full sm:w-auto">
          <Plus />New appointment
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card p-2 shadow-[0_1px_1px_rgb(0_0_0/0.04)]">
        <DnDCalendar
          localizer={localizer}
          events={events}
          view={view}
          date={date}
          onView={setSelectedView}
          onNavigate={setDate}
          onSelectSlot={({ start, end }) => setModal({ start, end })}
          onSelectEvent={(event) => setModal({ appointment: event.resource })}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventDrop}
          selectable
          resizable
          style={{ height: '100%' }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.color ?? 'var(--foreground)',
              borderRadius: '6px',
              border: 'none',
              color: 'var(--primary-foreground)',
              fontSize: '12px',
            },
          })}
        />
      </div>
      {modal && (
        <AppointmentModal
          appointment={modal.appointment}
          defaultStart={modal.start}
          defaultEnd={modal.end}
          timeZone={timeZone}
          onClose={() => setModal(null)}
          onSaved={() => setRefreshKey((key) => key + 1)}
        />
      )}
    </div>
  )
}
