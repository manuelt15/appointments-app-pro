'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import moment from 'moment-timezone'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TYPE_LABELS } from '@/lib/schedule/week'
import {
  businessMonthRange,
  businessYearRange,
  shiftHoursInRange,
  shiftsInRange,
  summariseEmployeesInRange,
  summariseYear,
  type EmployeeMonthRow,
} from '@/lib/shifts/business-history'
import { collectPaginatedResults } from '@/lib/shifts/pagination'
import { cn } from '@/lib/utils'
import type { Shift, ShiftType } from '@/types'

export interface HistoryEmployee {
  _id: string
  fullName: string
  color: string
  isActive: boolean
}

interface Props {
  businessName: string
  timeZone: string
  employees: HistoryEmployee[]
  currentYear: number
  currentMonth: number
}

const ALL = 'all'
const SHIFT_TYPES = Object.keys(TYPE_LABELS) as ShiftType[]
const MONTH_NAMES = moment.months()
const YEARS_BACK = 10

function formatHours(hours: number) {
  return `${hours.toLocaleString('en', { maximumFractionDigits: 1 })} h`
}

export default function ScheduleHistory({ businessName, timeZone, employees, currentYear, currentMonth }: Props) {
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [onlyWorked, setOnlyWorked] = useState(true)
  const [employeeFilter, setEmployeeFilter] = useState(ALL)
  const [typeFilter, setTypeFilter] = useState<ShiftType | typeof ALL>(ALL)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const range = businessYearRange(year, timeZone)

    async function loadYear() {
      setLoading(true)
      try {
        const results = await collectPaginatedResults<Shift>(async (page) => {
          const params = new URLSearchParams({
            start: range.start.toISOString(),
            end: range.end.toISOString(),
            limit: '200',
            page: String(page),
          })
          const response = await fetch(`/api/shifts?${params}`, { signal: controller.signal })
          if (!response.ok) throw new Error('The history could not be loaded.')
          return response.json()
        })
        setShifts(results)
        setError('')
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : 'The history could not be loaded.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadYear()
    return () => controller.abort()
  }, [year, timeZone])

  const employeesById = new Map(employees.map((employee) => [employee._id, employee]))
  const months = summariseYear(shifts, year, timeZone)
  const monthRange = businessMonthRange(year, month, timeZone)

  const filtered = shifts.filter((shift) =>
    (employeeFilter === ALL || shift.employeeId === employeeFilter) &&
    (typeFilter === ALL || shift.type === typeFilter)
  )
  const rowsWithRecords = summariseEmployeesInRange(filtered, monthRange, timeZone)
  const summary = {
    hours: rowsWithRecords.reduce((total, row) => total + row.hours, 0),
    workedShifts: rowsWithRecords.reduce((total, row) => total + row.workedShifts, 0),
    employees: rowsWithRecords.filter((row) => row.workedShifts > 0).length,
    absences: rowsWithRecords.reduce((total, row) => total + row.absences, 0),
  }

  let rows: EmployeeMonthRow[] = rowsWithRecords
  if (onlyWorked) {
    rows = rows.filter((row) => row.workedShifts > 0)
  } else {
    const listed = new Set(rows.map((row) => row.employeeId))
    const idle = employees
      .filter((employee) => employee.isActive && !listed.has(employee._id))
      .filter((employee) => employeeFilter === ALL || employee._id === employeeFilter)
      .map((employee) => ({ employeeId: employee._id, workedShifts: 0, hours: 0, daysWorked: 0, absences: 0 }))
    rows = [...rows, ...idle]
  }

  const details = shiftsInRange(filtered, monthRange)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  const monthLabel = `${MONTH_NAMES[month]} ${year}`
  const years = Array.from({ length: YEARS_BACK + 1 }, (_, index) => currentYear - index)
  const summaryTiles = [
    { label: 'Hours worked', value: formatHours(Math.round(summary.hours * 10) / 10) },
    { label: 'Shifts', value: String(summary.workedShifts) },
    { label: 'Employees who worked', value: String(summary.employees) },
    { label: 'Absences', value: String(summary.absences) },
  ]

  function formatEntryTime(shift: Shift) {
    const start = moment(shift.startTime).tz(timeZone)
    const end = moment(shift.endTime).tz(timeZone)
    return `${start.format('HH:mm')} – ${start.isSame(end, 'day') ? end.format('HH:mm') : end.format('D MMM HH:mm')}`
  }

  async function downloadPdf() {
    setDownloading(true)
    try {
      // Loaded on demand: pdf-lib is heavy and only needed here.
      const { buildHistoryPdf } = await import('@/lib/schedule/history-pdf')
      const employeeName = (id: string) => employeesById.get(id)?.fullName ?? 'Removed employee'
      const bytes = await buildHistoryPdf({
        businessName,
        monthLabel,
        filters: [
          employeeFilter === ALL ? 'All employees' : employeeName(employeeFilter),
          typeFilter === ALL ? 'All types' : TYPE_LABELS[typeFilter],
          onlyWorked ? 'Only employees who worked' : 'Including employees who did not work',
        ],
        summary: summaryTiles,
        employees: rows.map((row) => ({
          name: employeeName(row.employeeId),
          color: employeesById.get(row.employeeId)?.color ?? '#8f8f8f',
          shifts: row.workedShifts,
          hours: formatHours(row.hours),
          days: row.daysWorked,
          absences: row.absences,
        })),
        entries: details.map((shift) => ({
          date: moment(shift.startTime).tz(timeZone).format('ddd D MMM'),
          employee: employeeName(shift.employeeId),
          time: formatEntryTime(shift),
          hours: shift.type === 'shift' ? formatHours(shiftHoursInRange(shift, monthRange)) : '—',
          type: TYPE_LABELS[shift.type],
          notes: shift.notes ?? '',
        })),
      })
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `history-${year}-${String(month + 1).padStart(2, '0')}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (pdfError) {
      toast.error(pdfError instanceof Error ? pdfError.message : 'Could not build the PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="months-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="months-heading" className="text-sm font-semibold">Month by month</h2>
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="icon" aria-label="Previous year" onClick={() => setYear((value) => value - 1)}>
              <ChevronLeft />
            </Button>
            <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
              <SelectTrigger aria-label="Year" className="w-24 justify-center gap-1.5 font-medium tabular-nums">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {years.map((option) => (
                  <SelectItem key={option} value={String(option)}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next year"
              disabled={year >= currentYear}
              onClick={() => setYear((value) => value + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {months.map((overview) => {
            const selected = overview.month === month
            const empty = overview.workedShifts === 0 && overview.absences === 0
            return (
              <button
                key={overview.month}
                type="button"
                aria-pressed={selected}
                onClick={() => setMonth(overview.month)}
                className={cn(
                  'rounded-md border p-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30',
                  selected ? 'border-foreground bg-foreground text-primary-foreground' : 'bg-card can-hover:hover:bg-muted'
                )}
              >
                <span className="block text-sm font-medium">{MONTH_NAMES[overview.month]}</span>
                {loading ? (
                  <span className={cn('mt-1 block text-xs', selected ? 'opacity-70' : 'text-faint')}>…</span>
                ) : empty ? (
                  <span className={cn('mt-1 block text-xs', selected ? 'opacity-70' : 'text-faint')}>No shifts</span>
                ) : (
                  <span className={cn('mt-1 block text-xs tabular-nums', selected ? 'opacity-80' : 'text-body')}>
                    {formatHours(overview.hours)} · {overview.employees} {overview.employees === 1 ? 'person' : 'people'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {error ? (
        <div className="rounded-md border bg-card p-6 text-sm text-body" role="alert">{error}</div>
      ) : (
        <>
          <section aria-labelledby="month-heading" className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-center gap-3">
                <h2 id="month-heading" className="text-lg font-semibold tracking-[-0.01em]">{monthLabel}</h2>
                <Button type="button" variant="outline" size="sm" onClick={downloadPdf} disabled={loading || downloading}>
                  <FileDown />{downloading ? 'Preparing…' : 'Download PDF'}
                </Button>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="history-employee" className="text-xs text-body">Employee</Label>
                  <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                    <SelectTrigger id="history-employee" className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value={ALL}>All employees</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee._id} value={employee._id}>
                          {employee.fullName}{employee.isActive ? '' : ' (inactive)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="history-type" className="text-xs text-body">Type</Label>
                  <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ShiftType | typeof ALL)}>
                    <SelectTrigger id="history-type" className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value={ALL}>All types</SelectItem>
                      {SHIFT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{TYPE_LABELS[type]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex h-10 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={onlyWorked}
                    onChange={(event) => setOnlyWorked(event.target.checked)}
                    className="size-4 accent-foreground"
                  />
                  Only employees who worked
                </label>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {summaryTiles.map((tile) => (
                <div key={tile.label} className="rounded-md border bg-card p-4">
                  <dt className="text-xs text-body">{tile.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-[-0.02em] tabular-nums">{loading ? '…' : tile.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="employees-heading" className="space-y-3">
            <h2 id="employees-heading" className="text-sm font-semibold">By employee</h2>
            <div className="overflow-x-auto rounded-md border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs text-body">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Employee</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Shifts</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Hours</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Days worked</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Absences</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-body" role="status">Loading history…</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-body">Nobody worked in {monthLabel}.</td></tr>
                  ) : rows.map((row) => {
                    const employee = employeesById.get(row.employeeId)
                    return (
                      <tr key={row.employeeId} className="border-b last:border-b-0 can-hover:hover:bg-muted/50">
                        <td className="px-4 py-2.5">
                          <EmployeeName employee={employee} link />
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{row.workedShifts}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{formatHours(row.hours)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{row.daysWorked}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{row.absences}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="details-heading" className="space-y-3">
            <h2 id="details-heading" className="text-sm font-semibold">
              All entries <span className="font-normal text-body">({loading ? '…' : details.length})</span>
            </h2>
            <div className="overflow-x-auto rounded-md border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs text-body">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Date</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Employee</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Time</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Hours</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Type</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-body" role="status">Loading history…</td></tr>
                  ) : details.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-body">No entries in {monthLabel}.</td></tr>
                  ) : details.map((shift) => {
                    const start = moment(shift.startTime).tz(timeZone)
                    return (
                      <tr key={shift._id} className="border-b last:border-b-0">
                        <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">{start.format('ddd D MMM')}</td>
                        <td className="px-4 py-2.5"><EmployeeName employee={employeesById.get(shift.employeeId)} /></td>
                        <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-body">
                          {formatEntryTime(shift)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {shift.type === 'shift' ? formatHours(shiftHoursInRange(shift, monthRange)) : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn(
                            'rounded-sm px-1.5 py-0.5 text-xs font-medium',
                            shift.type === 'shift' ? 'bg-muted text-foreground' : 'bg-warning/15 text-foreground'
                          )}>
                            {TYPE_LABELS[shift.type]}
                          </span>
                        </td>
                        <td className="max-w-64 truncate px-4 py-2.5 text-body">{shift.notes}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function EmployeeName({ employee, link }: { employee?: HistoryEmployee; link?: boolean }) {
  if (!employee) return <span className="text-body">Removed employee</span>

  const content = (
    <span className="inline-flex items-center gap-2">
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: employee.color }} aria-hidden="true" />
      <span className="truncate">{employee.fullName}</span>
      {!employee.isActive && <span className="text-xs text-faint">inactive</span>}
    </span>
  )

  if (!link || !employee.isActive) return content
  return (
    <Link href={`/employees/${employee._id}`} className="rounded-sm outline-none can-hover:hover:underline focus-visible:ring-3 focus-visible:ring-ring/30">
      {content}
    </Link>
  )
}
