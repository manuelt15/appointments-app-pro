'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { differenceInCalendarDays, format, formatDistanceToNowStrict } from 'date-fns'
import { ArrowLeft, Cake, ChevronLeft, ChevronRight, Mail, Pencil, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseCalendarDate } from '@/lib/shifts/calendar-date'
import { monthsWithShifts, shiftsInMonth, summariseHistory } from '@/lib/shifts/history'
import { vacationBalance, vacationDaysInMonth } from '@/lib/shifts/vacation'
import { collectPaginatedResults } from '@/lib/shifts/pagination'
import type { Employee, Shift, ShiftType } from '@/types'

const TYPE_LABELS: Record<ShiftType, string> = {
  shift: 'Shift',
  vacation: 'Vacation',
  sick_leave: 'Sick leave',
  time_off: 'Time off',
}

export default function EmployeeDetail({ employeeId }: { employeeId: string }) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [monthIndex, setMonthIndex] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const [employeeResponse, history] = await Promise.all([
          fetch(`/api/employees/${employeeId}`, { signal: controller.signal }).then((response) => {
            if (response.status === 404) throw new Error('This employee does not exist.')
            if (!response.ok) throw new Error('Could not load this employee.')
            return response.json()
          }),
          collectPaginatedResults<Shift>(async (page) => {
            const query = new URLSearchParams({
              employee_id: employeeId,
              limit: '200',
              page: String(page),
            })
            const response = await fetch(`/api/shifts?${query}`, { signal: controller.signal })
            if (!response.ok) throw new Error('Could not load the shift history.')
            return response.json()
          }),
        ])

        setEmployee(employeeResponse.data)
        setShifts(history)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : 'Could not load this employee.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [employeeId])

  if (loading) {
    return <div className="grid min-h-full place-items-center text-sm text-body" role="status">Loading employee…</div>
  }

  if (error || !employee) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 text-sm text-body" role="alert">
        <p>{error || 'This employee does not exist.'}</p>
        <Button asChild variant="outline"><Link href="/employees">Back to employees</Link></Button>
      </div>
    )
  }

  const summary = summariseHistory(shifts)
  const startDate = employee.startDate ? parseCalendarDate(employee.startDate) : null
  const birthday = employee.birthday ? parseCalendarDate(employee.birthday) : null
  // Falls back to the record itself when no start date was entered.
  const since = startDate ?? (summary.firstShift ? new Date(summary.firstShift) : null)

  const months = monthsWithShifts(shifts)
  const activeMonth = months[Math.min(monthIndex, Math.max(months.length - 1, 0))]
  const monthShifts = activeMonth ? shiftsInMonth(shifts, activeMonth.year, activeMonth.month) : []
  const monthSummary = summariseHistory(monthShifts)
  const monthVacationDays = activeMonth
    ? vacationDaysInMonth(shifts, activeMonth.year, activeMonth.month)
    : 0
  // Allowance is per calendar year, so it follows the year being looked at.
  const balance = vacationBalance(shifts, activeMonth?.year ?? new Date().getFullYear())
  const ordered = [...monthShifts].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-2 border-b bg-card px-4 py-3 sm:px-6">
        <Button asChild variant="ghost" size="icon" aria-label="Back to employees">
          <Link href="/employees"><ArrowLeft /></Link>
        </Button>
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: employee.color }} aria-hidden="true" />
        <h1 className="truncate text-xl font-semibold tracking-[-0.02em]">{employee.fullName}</h1>
        {!employee.isActive && (
          <span className="rounded-sm bg-muted px-2 py-0.5 text-xs text-body">Inactive</span>
        )}
        <Button asChild variant="outline" size="sm" className="ml-auto">
          <Link href={`/employees/${employee._id}/edit`}><Pencil />Edit</Link>
        </Button>
      </header>

      <div className="w-full max-w-3xl space-y-6 p-4 sm:p-6">
        <section className="rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="contact-title">
          <h2 id="contact-title" className="text-base font-semibold">Details</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Detail icon={<Mail className="size-4" />} label="Email" value={employee.email} />
            <Detail icon={<Phone className="size-4" />} label="Phone" value={employee.phone} />
            <Detail
              icon={<Cake className="size-4" />}
              label="Birthday"
              value={birthday ? format(birthday, 'd MMMM') : undefined}
            />
            <Detail
              label="On the team since"
              value={since ? `${format(since, 'MMMM yyyy')} (${formatDistanceToNowStrict(since)})` : undefined}
              hint={!startDate && since ? 'Taken from their first shift' : undefined}
            />
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="stats-title">
          <h2 id="stats-title" className="text-base font-semibold">All time</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Shifts worked" value={String(summary.workedShifts)} />
            <Stat label="Hours" value={String(summary.hours)} />
            <Stat label="Absences" value={String(summary.absences)} />
            <Stat
              label="Last shift"
              value={summary.lastShift ? format(new Date(summary.lastShift), 'd MMM') : 'None'}
            />
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="vacation-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="vacation-title" className="text-base font-semibold">Vacation</h2>
            <span className="text-sm text-body">
              {balance.taken} of {balance.allowance} days used in {activeMonth?.year ?? new Date().getFullYear()}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${balance.taken} of ${balance.allowance} vacation days used`}>
            <div
              className="h-full rounded-full bg-foreground transition-[width]"
              style={{ width: `${Math.min((balance.taken / balance.allowance) * 100, 100)}%` }}
            />
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-4">
            <Stat label="Days taken" value={String(balance.taken)} />
            <Stat label="Days left" value={String(balance.remaining)} />
            <Stat label="This month" value={String(monthVacationDays)} />
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="history-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="history-title" className="text-base font-semibold">History</h2>
            {months.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Later month"
                  disabled={monthIndex === 0}
                  onClick={() => setMonthIndex((index) => Math.max(index - 1, 0))}
                >
                  <ChevronLeft />
                </Button>
                <span className="min-w-36 text-center text-sm font-medium" aria-live="polite">
                  {activeMonth ? format(new Date(activeMonth.year, activeMonth.month, 1), 'MMMM yyyy') : ''}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Earlier month"
                  disabled={monthIndex >= months.length - 1}
                  onClick={() => setMonthIndex((index) => Math.min(index + 1, months.length - 1))}
                >
                  <ChevronRight />
                </Button>
              </div>
            )}
          </div>

          {activeMonth && (
            <dl className="mt-4 grid grid-cols-3 gap-4 border-b pb-4">
              <Stat label="Shifts" value={String(monthSummary.workedShifts)} />
              <Stat label="Hours" value={String(monthSummary.hours)} />
              <Stat label="Absences" value={String(monthSummary.absences)} />
            </dl>
          )}
          {ordered.length === 0 ? (
            <p className="mt-4 text-sm text-body">Nothing recorded in this month.</p>
          ) : (
            <ul className="mt-4 divide-y">
              {ordered.map((shift) => {
                const start = new Date(shift.startTime)
                const end = new Date(shift.endTime)
                const days = differenceInCalendarDays(end, start)

                return (
                  <li key={shift._id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{format(start, 'EEE d MMM yyyy')}</p>
                      <p className="text-xs text-body">
                        {shift.type === 'shift'
                          ? `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`
                          : `${TYPE_LABELS[shift.type]}${days > 0 ? ` · ${days + 1} days` : ''}`}
                        {shift.notes && ` · ${shift.notes}`}
                      </p>
                    </div>
                    {shift.type === 'shift' && (
                      <span className="shrink-0 font-mono text-xs text-body">
                        {Math.round(((end.getTime() - start.getTime()) / 3_600_000) * 10) / 10}h
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Detail({ icon, label, value, hint }: { icon?: React.ReactNode; label: string; value?: string; hint?: string }) {
  return (
    <div>
      <dt className="text-xs text-body">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-2 text-sm">
        {value ? (
          <>
            {icon && <span className="text-body" aria-hidden="true">{icon}</span>}
            <span className="truncate">{value}</span>
          </>
        ) : (
          <span className="text-body">Not set</span>
        )}
      </dd>
      {hint && <p className="mt-0.5 text-xs text-body">{hint}</p>}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-body">{label}</dt>
      <dd className="mt-0.5 text-xl font-semibold tracking-[-0.02em]">{value}</dd>
    </div>
  )
}
