'use client'

import Link from 'next/link'
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
import { DateTimePicker } from '@/components/ui/date-time-picker'
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
import type { Employee, Shift, ShiftType } from '@/types'

interface Props {
  shift?: Shift | null
  defaultStart?: Date
  defaultEnd?: Date
  defaultEmployeeId?: string
  timeZone: string
  onClose: () => void
  onSaved: () => void
}

const TYPE_OPTIONS: { value: ShiftType; label: string }[] = [
  { value: 'shift', label: 'Working shift' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick_leave', label: 'Sick leave' },
  { value: 'time_off', label: 'Time off' },
]

export default function ShiftModal({ shift, defaultStart, defaultEnd, defaultEmployeeId, timeZone, onClose, onSaved }: Props) {
  const formId = useId()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [employeeError, setEmployeeError] = useState('')
  const [employeeId, setEmployeeId] = useState(shift?.employeeId ?? defaultEmployeeId ?? '')
  const [type, setType] = useState<ShiftType>(shift?.type ?? 'shift')
  const [notes, setNotes] = useState(shift?.notes ?? '')
  const [startTime, setStartTime] = useState(
    shift ? toBusinessDateTimeLocal(shift.startTime, timeZone) : calendarDateToLocalInput(defaultStart)
  )
  const [endTime, setEndTime] = useState(
    shift ? toBusinessDateTimeLocal(shift.endTime, timeZone) : calendarDateToLocalInput(defaultEnd)
  )
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const noEmployees = !employeesLoading && !employeeError && employees.length === 0

  useEffect(() => {
    const controller = new AbortController()

    async function fetchEmployees() {
      try {
        const response = await fetch('/api/employees', { signal: controller.signal })
        if (!response.ok) throw new Error('Could not load employees')

        const data = await response.json()
        const items: Employee[] = data.data ?? []
        setEmployees(items)
        setEmployeeId((current) => current || items[0]?._id || '')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setEmployeeError('Employees could not be loaded. Close the form and try again.')
      } finally {
        if (!controller.signal.aborted) setEmployeesLoading(false)
      }
    }

    fetchEmployees()
    return () => controller.abort()
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!employeeId) {
      toast.error('Choose an employee before saving')
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
        employeeId,
        type,
        notes: notes || null,
        startTime: startTimeIso,
        endTime: endTimeIso,
      }
      const url = shift ? `/api/shifts/${shift._id}` : '/api/shifts'
      const response = await fetch(url, {
        method: shift ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Failed to save shift')
      }

      toast.success(shift ? 'Shift updated' : 'Shift created')
      onSaved()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save shift')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!shift) return

    setLoading(true)
    try {
      const response = await fetch(`/api/shifts/${shift._id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete shift')

      toast.success('Shift deleted')
      onSaved()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete shift')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <DialogTitle>{shift ? 'Edit shift' : 'New shift'}</DialogTitle>
          <DialogDescription>
            {shift ? 'Update who works and when.' : 'Schedule a block of time for an employee.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="space-y-4 p-5">
            <Field id={`${formId}-employee`} label="Employee">
              <Select value={employeeId} onValueChange={setEmployeeId} disabled={Boolean(employeeError) || employees.length === 0}>
                <SelectTrigger id={`${formId}-employee`} className="w-full" aria-invalid={Boolean(employeeError)}>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>{employee.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {employeeError && <p className="text-xs text-destructive" role="alert">{employeeError}</p>}
              {noEmployees && (
                <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground" role="status">
                  <p>No employees yet. Add someone to the team before scheduling shifts.</p>
                  <p className="mt-1.5">
                    <Link href="/employees/new" className="font-medium text-foreground underline underline-offset-2">Add employee</Link>
                  </p>
                </div>
              )}
            </Field>

            <Field id={`${formId}-type`} label="Type">
              <Select value={type} onValueChange={(value) => setType(value as ShiftType)}>
                <SelectTrigger id={`${formId}-type`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`${formId}-start`} label="Start">
                <DateTimePicker id={`${formId}-start`} value={startTime} onChange={setStartTime} />
              </Field>
              <Field id={`${formId}-end`} label="End">
                <DateTimePicker id={`${formId}-end`} value={endTime} onChange={setEndTime} />
              </Field>
            </div>

            <Field id={`${formId}-notes`} label="Notes">
              <Input id={`${formId}-notes`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional" />
            </Field>
          </div>

          <DialogFooter className="m-0 rounded-none px-5 py-4">
            {shift && (
              <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirmation(true)} disabled={loading} className="sm:mr-auto">
                Delete shift
              </Button>
            )}
            <Button type="submit" disabled={loading || Boolean(employeeError) || employees.length === 0}>
              {loading ? 'Saving…' : shift ? 'Update shift' : 'Create shift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        title="Delete shift?"
        description="The shift will be removed from the schedule."
        confirmLabel="Delete shift"
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
