'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import type { Appointment, Calendar } from '@/types'

interface Props {
  appointment?: Appointment | null
  defaultStart?: Date
  defaultEnd?: Date
  onClose: () => void
  onSaved: () => void
}

const STATUS_OPTIONS = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] as const

export default function AppointmentModal({ appointment, defaultStart, defaultEnd, onClose, onSaved }: Props) {
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [title, setTitle] = useState(appointment?.title ?? '')
  const [clientName, setClientName] = useState(appointment?.clientName ?? '')
  const [clientEmail, setClientEmail] = useState(appointment?.clientEmail ?? '')
  const [clientPhone, setClientPhone] = useState(appointment?.clientPhone ?? '')
  const [calendarId, setCalendarId] = useState(appointment?.calendarId ?? '')
  const [startTime, setStartTime] = useState(toDatetimeLocal(appointment?.startTime ?? defaultStart))
  const [endTime, setEndTime] = useState(toDatetimeLocal(appointment?.endTime ?? defaultEnd))
  const [status, setStatus] = useState(appointment?.status ?? 'scheduled')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/calendars')
      .then((r) => r.json())
      .then((d) => {
        setCalendars(d.data ?? [])
        if (!calendarId && d.data?.length > 0) setCalendarId(d.data[0]._id)
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      title,
      clientName,
      clientEmail: clientEmail || null,
      clientPhone: clientPhone || null,
      calendarId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      status,
    }

    const url = appointment ? `/api/appointments/${appointment._id}` : '/api/appointments'
    const method = appointment ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to save appointment')
    } else {
      toast.success(appointment ? 'Appointment updated' : 'Appointment created')
      onSaved()
      onClose()
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!appointment || !confirm('Cancel this appointment?')) return
    await fetch(`/api/appointments/${appointment._id}`, { method: 'DELETE' })
    toast.success('Appointment cancelled')
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-[#d2d2d7] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#d2d2d7]">
          <h2 className="text-base font-semibold text-[#1d1d1f]">
            {appointment ? 'Edit appointment' : 'New appointment'}
          </h2>
          <button onClick={onClose} className="text-[#6e6e73] hover:text-[#1d1d1f]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className={INPUT} placeholder="Appointment title" />
          </Field>
          <Field label="Client name">
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} required className={INPUT} placeholder="John Doe" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={INPUT} placeholder="Optional" />
            </Field>
            <Field label="Phone">
              <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={INPUT} placeholder="Optional" />
            </Field>
          </div>
          <Field label="Calendar">
            <select value={calendarId} onChange={(e) => setCalendarId(e.target.value)} required className={INPUT}>
              {calendars.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={INPUT} />
            </Field>
            <Field label="End">
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className={INPUT} />
            </Field>
          </div>
          {appointment && (
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={INPUT}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0066cc] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : appointment ? 'Update' : 'Create'}
            </button>
            {appointment && (
              <button
                type="button"
                onClick={handleDelete}
                className="py-2.5 px-4 rounded-full border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6e6e73] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const INPUT = 'w-full rounded-lg border border-[#86868b] px-3 py-2 text-sm text-[#1d1d1f] placeholder-[#6e6e73] focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3] bg-white'

function toDatetimeLocal(date?: string | Date): string {
  if (!date) {
    const d = new Date()
    d.setMinutes(d.getMinutes() + 30, 0, 0)
    date = d
  }
  const d = new Date(date)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
