'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Employee } from '@/types'

export const EMPLOYEE_COLORS = ['#6366f1', '#0070f3', '#10b981', '#f5a623', '#ee0000', '#7928ca', '#ff0080', '#14b8a6']

interface Props {
  employee?: Employee
  onSaved?: () => void
}

export default function EmployeeForm({ employee, onSaved }: Props) {
  const [fullName, setFullName] = useState(employee?.fullName ?? '')
  const [email, setEmail] = useState(employee?.email ?? '')
  const [phone, setPhone] = useState(employee?.phone ?? '')
  const [birthday, setBirthday] = useState(employee?.birthday ?? '')
  const [startDate, setStartDate] = useState(employee?.startDate ?? '')
  const [color, setColor] = useState(employee?.color ?? EMPLOYEE_COLORS[0])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    try {
      const payload = {
        fullName,
        email: email || null,
        phone: phone || null,
        birthday: birthday || null,
        startDate: startDate || null,
        color,
      }
      const response = await fetch(
        employee ? `/api/employees/${employee._id}` : '/api/employees',
        {
          method: employee ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Failed to save employee')
      }

      toast.success(employee ? 'Employee updated' : 'Employee added')
      onSaved?.()
      router.push(employee ? `/employees/${employee._id}` : '/employees')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-card p-5 sm:p-6" aria-busy={loading}>
      <div className="space-y-2">
        <Label htmlFor="full-name">Full name</Label>
        <Input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="name" placeholder="Jane Smith" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email <span className="font-normal text-body">(optional)</span></Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="jane@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone <span className="font-normal text-body">(optional)</span></Label>
          <Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="+34 600 00 00 00" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="birthday">Birthday <span className="font-normal text-body">(optional)</span></Label>
          <DatePicker id="birthday" value={birthday} onChange={setBirthday} placeholder="Pick a birthday" yearsBack={80} yearsForward={0} />
          <p className="text-xs text-body">Marked on the schedule every year.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="start-date">Start date <span className="font-normal text-body">(optional)</span></Label>
          <DatePicker id="start-date" value={startDate} onChange={setStartDate} placeholder="Pick a start date" yearsBack={40} yearsForward={1} />
          <p className="text-xs text-body">Used to show how long they have been on the team.</p>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Calendar color</legend>
        <ColorPicker colors={EMPLOYEE_COLORS} value={color} onChange={setColor} label="Employee color" />
      </fieldset>

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? 'Saving…' : employee ? 'Save changes' : 'Add employee'}
      </Button>
    </form>
  )
}
