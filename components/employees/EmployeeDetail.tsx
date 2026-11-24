'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
} from 'date-fns'
import { ArrowLeft, Cake, ChevronLeft, ChevronRight, Mail, Pencil, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { useLocale } from '@/lib/i18n/client'
import { dateFnsLocale, formatDate } from '@/lib/i18n/dates'
import { t as translate } from '@/lib/i18n/translate'
import { parseCalendarDate } from '@/lib/shifts/calendar-date'
import { monthsWithShifts, shiftsInMonth, summariseHistory } from '@/lib/shifts/history'
import { shiftTypeKey } from '@/lib/shifts/labels'
import { vacationBalance, vacationDaysInMonth } from '@/lib/shifts/vacation'
import { collectPaginatedResults } from '@/lib/shifts/pagination'
import type { Employee, Shift } from '@/types'

export default function EmployeeDetail({ employeeId }: { employeeId: string }) {
  const { locale, t } = useLocale()
  const names = dateFnsLocale(locale)
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
            if (response.status === 404) throw new Error(translate(locale, 'employees.notFound'))
            if (!response.ok) throw new Error(translate(locale, 'employees.loadOneError'))
            return response.json()
          }),
          collectPaginatedResults<Shift>(async (page) => {
            const query = new URLSearchParams({
              employee_id: employeeId,
              limit: '200',
              page: String(page),
            })
            const response = await fetch(`/api/shifts?${query}`, { signal: controller.signal })
            if (!response.ok) throw new Error(translate(locale, 'employees.historyLoadError'))
            return response.json()
          }),
        ])

        setEmployee(employeeResponse.data)
        setShifts(history)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : translate(locale, 'employees.loadOneError'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [employeeId, locale])

  if (loading) {
    return <div className="grid min-h-full place-items-center"><LoadingState label={t('employees.loadingProfile')} /></div>
  }

  if (error || !employee) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 text-sm text-body" role="alert">
        <p>{error || t('employees.notFound')}</p>
        <Button asChild variant="outline"><Link href="/employees">{t('employees.backToList')}</Link></Button>
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
        <Button asChild variant="ghost" size="icon" aria-label={t('employees.backToList')}>
          <Link href="/employees"><ArrowLeft /></Link>
        </Button>
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: employee.color }} aria-hidden="true" />
        <h1 className="truncate text-xl font-semibold tracking-[-0.02em]">{employee.fullName}</h1>
        {!employee.isActive && (
          <span className="rounded-sm bg-muted px-2 py-0.5 text-xs text-body">{t('employees.inactive')}</span>
        )}
        <Button asChild variant="outline" size="sm" className="ml-auto">
          <Link href={`/employees/${employee._id}/edit`}><Pencil />{t('employees.edit')}</Link>
        </Button>
      </header>

      <div className="w-full max-w-3xl space-y-6 p-4 sm:p-6">
        <section className="rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="contact-title">
          <h2 id="contact-title" className="text-base font-semibold">{t('employees.details')}</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Detail icon={<Mail className="size-4" />} label={t('employees.email')} value={employee.email} />
            <Detail icon={<Phone className="size-4" />} label={t('employees.phone')} value={employee.phone} />
            <Detail
              icon={<Cake className="size-4" />}
              label={t('employees.birthday')}
              value={birthday ? formatDate(birthday, 'd MMMM', locale) : undefined}
            />
            <Detail
              label={t('employees.since')}
              value={since
                ? t('employees.sinceValue', {
                    date: formatDate(since, 'MMMM yyyy', locale),
                    duration: formatDistanceToNowStrict(since, { locale: names, addSuffix: false }),
                  })
                : undefined}
              hint={!startDate && since ? t('employees.sinceHint') : undefined}
            />
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="stats-title">
          <h2 id="stats-title" className="text-base font-semibold">{t('employees.allTime')}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label={t('employees.shiftsWorked')} value={String(summary.workedShifts)} />
            <Stat label={t('employees.hours')} value={String(summary.hours)} />
            <Stat label={t('employees.absences')} value={String(summary.absences)} />
            <Stat
              label={t('employees.lastShift')}
              value={summary.lastShift ? formatDate(new Date(summary.lastShift), 'd MMM', locale) : t('employees.none')}
            />
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="vacation-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="vacation-title" className="text-base font-semibold">{t('employees.vacation')}</h2>
            <span className="text-sm text-body">
              {t('employees.vacationUsed', {
                taken: balance.taken,
                allowance: balance.allowance,
                year: activeMonth?.year ?? new Date().getFullYear(),
              })}
            </span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={t('employees.vacationAria', { taken: balance.taken, allowance: balance.allowance })}
          >
            <div
              className="h-full rounded-full bg-foreground transition-[width]"
              style={{ width: `${Math.min((balance.taken / balance.allowance) * 100, 100)}%` }}
            />
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-4">
            <Stat label={t('employees.daysTaken')} value={String(balance.taken)} />
            <Stat label={t('employees.daysLeft')} value={String(balance.remaining)} />
            <Stat label={t('employees.thisMonth')} value={String(monthVacationDays)} />
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="history-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="history-title" className="text-base font-semibold">{t('employees.history')}</h2>
            {months.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={t('employees.laterMonth')}
                  disabled={monthIndex === 0}
                  onClick={() => setMonthIndex((index) => Math.max(index - 1, 0))}
                >
                  <ChevronLeft />
                </Button>
                <span className="min-w-36 text-center text-sm font-medium" aria-live="polite">
                  {activeMonth ? formatDate(new Date(activeMonth.year, activeMonth.month, 1), 'MMMM yyyy', locale) : ''}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={t('employees.earlierMonth')}
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
              <Stat label={t('employees.shifts')} value={String(monthSummary.workedShifts)} />
              <Stat label={t('employees.hours')} value={String(monthSummary.hours)} />
              <Stat label={t('employees.absences')} value={String(monthSummary.absences)} />
            </dl>
          )}
          {ordered.length === 0 ? (
            <p className="mt-4 text-sm text-body">{t('employees.nothingInMonth')}</p>
          ) : (
            <ul className="mt-4 divide-y">
              {ordered.map((shift) => {
                const start = new Date(shift.startTime)
                const end = new Date(shift.endTime)
                const days = differenceInCalendarDays(end, start)
                const typeLabel = t(shiftTypeKey(shift.type))

                return (
                  <li key={shift._id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{formatDate(start, 'EEE d MMM yyyy', locale)}</p>
                      <p className="text-xs text-body">
                        {shift.type === 'shift'
                          ? `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`
                          : days > 0 ? t('employees.absenceRange', { type: typeLabel, days: days + 1 }) : typeLabel}
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
  const { t } = useLocale()
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
          <span className="text-body">{t('employees.notSet')}</span>
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
