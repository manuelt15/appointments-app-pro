'use client'

import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  businessDateTimeLocalToIso,
  calendarDateToLocalInput,
  toBusinessDateTimeLocal,
} from '@/lib/datetime/timezone'
import type { Appointment, AppointmentStatus, Calendar } from '@/types'

interface Props {
  appointment?: Appointment | null
  defaultStart?: Date
  defaultEnd?: Date
  timeZone: string
  onClose: () => void
  onSaved: () => void
}

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No show' },
]

export default function AppointmentModal({ appointment, defaultStart, defaultEnd, timeZone, onClose, onSaved }: Props) {
  const formId = useId()
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [calendarError, setCalendarError] = useState('')
  const [title, setTitle] = useState(appointment?.title ?? '')
  const [clientName, setClientName] = useState(appointment?.clientName ?? '')
  const [clientEmail, setClientEmail] = useState(appointment?.clientEmail ?? '')
  const [clientPhone, setClientPhone] = useState(appointment?.clientPhone ?? '')
  const [calendarId, setCalendarId] = useState(appointment?.calendarId ?? '')
  const [startTime, setStartTime] = useState(
    appointment ? toBusinessDateTimeLocal(appointment.startTime, timeZone) : calendarDateToLocalInput(defaultStart)
  )
  const [endTime, setEndTime] = useState(
    appointment ? toBusinessDateTimeLocal(appointment.endTime, timeZone) : calendarDateToLocalInput(defaultEnd)
  )
  const [status, setStatus] = useState<AppointmentStatus>(appointment?.status ?? 'scheduled')
  const [loading, setLoading] = useState(false)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const calendarsPath = appointment?.calendarId
    ? `/api/calendars?include_id=${encodeURIComponent(appointment.calendarId)}`
    : '/api/calendars'

  useEffect(() => {
    const controller = new AbortController()

    async function fetchCalendars() {
      try {
        const response = await fetch(calendarsPath, { signal: controller.signal })
        if (!response.ok) throw new Error('Could not load calendars')

        const data = await response.json()
        const items: Calendar[] = data.data ?? []
        setCalendars(items)
        setCalendarId((current) => current || items[0]?._id || '')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setCalendarError('Calendars could not be loaded. Close the form and try again.')
      }
    }

    fetchCalendars()
    return () => controller.abort()
  }, [calendarsPath])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!calendarId) {
      toast.error('Choose a calendar before saving')
      return
    }
    let startTimeIso: string
    let endTimeIso: string
    try {
      startTimeIso = businessDateTimeLocalToIso(startTime, timeZone)
      endTimeIso = businessDateTimeLocalToIso(endTime, timeZone)
    } catch {
      toast.error('Choose a valid date and time for this business timezone')
      return
    }

    if (new Date(endTimeIso).getTime() <= new Date(startTimeIso).getTime()) {
      toast.error('End time must be after start time')
      return
    }

    setLoading(true)

    try {
      const payload = {
        title,
        clientName,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        calendarId,
        startTime: startTimeIso,
        endTime: endTimeIso,
        status,
      }
      const url = appointment ? `/api/appointments/${appointment._id}` : '/api/appointments'
      const response = await fetch(url, {
        method: appointment ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Failed to save appointment')
      }

      toast.success(appointment ? 'Appointment updated' : 'Appointment created')
      onSaved()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save appointment')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!appointment) return

    setLoading(true)
    try {
      const response = await fetch(`/api/appointments/${appointment._id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to cancel appointment')

      toast.success('Appointment cancelled')
      onSaved()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel appointment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <DialogTitle>{appointment ? 'Edit appointment' : 'New appointment'}</DialogTitle>
          <DialogDescription>
            {appointment ? 'Update the booking details and schedule.' : 'Add a booking to an available calendar.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="space-y-4 p-5">
            <Field id={`${formId}-title`} label="Title">
              <Input id={`${formId}-title`} value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Appointment title" />
            </Field>

            <Field id={`${formId}-client-name`} label="Client name">
              <Input id={`${formId}-client-name`} value={clientName} onChange={(event) => setClientName(event.target.value)} required placeholder="John Doe" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`${formId}-email`} label="Email">
                <Input id={`${formId}-email`} type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder="Optional" />
              </Field>
              <Field id={`${formId}-phone`} label="Phone">
                <Input id={`${formId}-phone`} type="tel" value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="Optional" />
              </Field>
            </div>

            <Field id={`${formId}-calendar`} label="Calendar">
              <Select value={calendarId} onValueChange={setCalendarId} disabled={Boolean(calendarError) || calendars.length === 0}>
                <SelectTrigger id={`${formId}-calendar`} className="w-full" aria-invalid={Boolean(calendarError)}>
                  <SelectValue placeholder="Select a calendar" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar._id} value={calendar._id}>{calendar.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {calendarError && <p className="text-xs text-destructive" role="alert">{calendarError}</p>}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`${formId}-start`} label="Start">
                <Input id={`${formId}-start`} type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
              </Field>
              <Field id={`${formId}-end`} label="End">
                <Input id={`${formId}-end`} type="datetime-local" value={endTime} min={startTime} onChange={(event) => setEndTime(event.target.value)} required />
              </Field>
            </div>

            {appointment && (
              <Field id={`${formId}-status`} label="Status">
                <Select value={status} onValueChange={(value) => setStatus(value as AppointmentStatus)}>
                  <SelectTrigger id={`${formId}-status`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>

          <DialogFooter className="m-0 rounded-none px-5 py-4">
            {appointment && (
              <Button type="button" variant="destructive" onClick={() => setShowCancelConfirmation(true)} disabled={loading} className="sm:mr-auto">
                Cancel appointment
              </Button>
            )}
            <Button type="submit" disabled={loading || Boolean(calendarError) || calendars.length === 0}>
              {loading ? 'Saving…' : appointment ? 'Update appointment' : 'Create appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={showCancelConfirmation}
        onOpenChange={setShowCancelConfirmation}
        title="Cancel appointment?"
        description="The appointment will remain in the calendar with a cancelled status."
        confirmLabel="Cancel appointment"
        loading={loading}
        onConfirm={handleDelete}
      />
    </>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
