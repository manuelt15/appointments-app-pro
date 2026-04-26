'use client'
import { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { toast } from 'sonner'
import AppointmentModal from './AppointmentModal'
import type { Appointment } from '@/types'

const localizer = momentLocalizer(moment)
const DnDCalendar = withDragAndDrop(Calendar)

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Appointment
  color?: string
}

export default function GlobalCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [view, setView] = useState(Views.WEEK)
  const [date, setDate] = useState(new Date())
  const [modal, setModal] = useState<{ appointment?: Appointment; start?: Date; end?: Date } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAppointments = useCallback(async () => {
    const start = moment(date).startOf('month').subtract(1, 'week').toISOString()
    const end = moment(date).endOf('month').add(1, 'week').toISOString()
    const res = await fetch(`/api/appointments?start=${start}&end=${end}&limit=500`)
    const data = await res.json()
    const items: Appointment[] = data.data ?? []
    setEvents(items.map((a) => ({
      id: a._id,
      title: `${a.title} – ${a.clientName}`,
      start: new Date(a.startTime),
      end: new Date(a.endTime),
      resource: a,
      color: a.status === 'cancelled' ? '#d2d2d7' : undefined,
    })))
    setLoading(false)
  }, [date])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  async function handleEventDrop({ event, start, end }: any) {
    const res = await fetch(`/api/appointments/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
      }),
    })
    if (res.ok) {
      toast.success('Appointment moved')
      fetchAppointments()
    } else {
      toast.error('Could not move appointment')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-sm text-[#6e6e73]">Loading…</div>
  }

  return (
    <div className="h-full bg-white rounded-2xl border border-[#d2d2d7] overflow-hidden p-2">
      <DnDCalendar
        localizer={localizer}
        events={events}
        view={view}
        date={date}
        onView={(v) => setView(v as any)}
        onNavigate={setDate}
        onSelectSlot={({ start, end }) => setModal({ start, end })}
        onSelectEvent={(event) => setModal({ appointment: (event as CalendarEvent).resource })}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventDrop}
        selectable
        resizable
        style={{ height: '100%' }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: (event as CalendarEvent).color ?? '#0071e3',
            borderRadius: '6px',
            border: 'none',
            color: '#fff',
            fontSize: '12px',
          },
        })}
      />
      {modal && (
        <AppointmentModal
          appointment={modal.appointment}
          defaultStart={modal.start}
          defaultEnd={modal.end}
          onClose={() => setModal(null)}
          onSaved={fetchAppointments}
        />
      )}
    </div>
  )
}
