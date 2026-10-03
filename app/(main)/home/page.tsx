import Image from 'next/image'
import Link from 'next/link'
import moment from 'moment-timezone'
import { AlertTriangle, CalendarDays, Plus, UserPlus } from 'lucide-react'
import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import { connectDB } from '@/lib/mongodb/client'
import { Business } from '@/lib/mongodb/models/Business'
import { Employee } from '@/lib/mongodb/models/Employee'
import { Shift } from '@/lib/mongodb/models/Shift'
import { buildHomeWeek, businessWeekRange } from '@/lib/schedule/home-week'
import { toPlainEmployee, toPlainShift } from '@/lib/schedule/serialize'
import { cn } from '@/lib/utils'

interface HomeBusiness {
  _id: { toString(): string }
  name: string
  timezone: string
}

export default async function HomePage() {
  const session = await auth()
  await connectDB()
  const business = await Business.findOne({ ownerId: session!.user!.id })
    .select('_id name timezone')
    .lean<HomeBusiness>()
  const timeZone = business?.timezone ?? 'Europe/Madrid'
  const businessId = business?._id.toString()
  const now = new Date()
  const range = businessWeekRange(now, timeZone)

  const [employees, shifts] = await Promise.all([
    Employee.find({ businessId, isActive: true }).sort({ fullName: 1 }).lean(),
    Shift.find({ businessId, startTime: { $lt: range.end }, endTime: { $gt: range.start } }).lean(),
  ])
  const week = buildHomeWeek(employees.map(toPlainEmployee), shifts.map(toPlainShift), now, timeZone)

  const today = moment(now).tz(timeZone).format('YYYY-MM-DD')
  const weekLabel = `${moment(range.start).tz(timeZone).format('D MMM')} – ${moment(range.end).tz(timeZone).subtract(1, 'day').format('D MMM YYYY')}`
  const firstName = session?.user?.name?.split(' ')[0]
  const working = week.scheduled.filter((row) => row.hours > 0)
  const totalHours = Math.round(week.scheduled.reduce((total, row) => total + row.hours, 0) * 10) / 10

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b bg-card px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center gap-4">
          <Image
            src="/business-default.svg"
            alt=""
            width={64}
            height={64}
            unoptimized
            className="shrink-0 rounded-full"
          />
          <div className="min-w-0">
            <p className="text-sm text-body">Welcome back{firstName ? `, ${firstName}` : ''}</p>
            <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{business?.name}</h1>
          </div>
        </div>
        <p className="mt-4 max-w-xl text-sm text-body">
          Here is how your team looks this week. Check who is working, spot anyone still without a schedule,
          and jump into the planner when something needs a change.
        </p>
      </header>

      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <section aria-labelledby="week-heading" className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="week-heading" className="text-lg font-semibold tracking-[-0.01em]">This week</h2>
              <p className="text-sm text-body tabular-nums">{weekLabel}</p>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/dashboard"><CalendarDays />Open schedule</Link>
            </Button>
          </div>

          {employees.length === 0 ? (
            <Notice
              title="You have no employees yet"
              action={<Link href="/employees/new"><UserPlus />Add employee</Link>}
            >
              Add your team first, then plan their shifts.
            </Notice>
          ) : week.scheduled.length === 0 ? (
            <Notice
              title="There is no schedule for this week"
              action={<Link href="/dashboard?new=shift"><Plus />New shift</Link>}
            >
              Nobody has a shift or an absence between {weekLabel}.
            </Notice>
          ) : week.unassigned.length > 0 ? (
            <Notice
              title={`${week.unassigned.length} ${week.unassigned.length === 1 ? 'employee has' : 'employees have'} no schedule this week`}
              action={<Link href="/dashboard"><CalendarDays />Assign shifts</Link>}
            >
              <span className="flex flex-wrap gap-x-3 gap-y-1">
                {week.unassigned.map((employee) => (
                  <span key={employee._id} className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: employee.color }} aria-hidden="true" />
                    {employee.fullName}
                  </span>
                ))}
              </span>
            </Notice>
          ) : null}

          {employees.length > 0 && (
            <dl className="grid grid-cols-3 gap-2">
              {[
                { label: 'Working', value: working.length },
                { label: 'Hours planned', value: `${totalHours} h` },
                { label: 'Without schedule', value: week.unassigned.length },
              ].map((tile) => (
                <div key={tile.label} className="rounded-md border bg-card p-3 sm:p-4">
                  <dt className="text-xs text-body">{tile.label}</dt>
                  <dd className="mt-1 text-xl font-semibold tracking-[-0.02em] tabular-nums sm:text-2xl">{tile.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {week.scheduled.length > 0 && (
            <div className="overflow-x-auto rounded-md border bg-card">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b text-xs text-body">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium">Employee</th>
                    {week.days.map((day) => (
                      <th
                        key={day.date}
                        scope="col"
                        className={cn('px-2 py-2.5 text-center font-medium', day.date === today && 'bg-muted text-foreground')}
                      >
                        {day.label}
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {week.scheduled.map((row) => (
                    <tr key={row.employee._id} className="border-b last:border-b-0">
                      <th scope="row" className="px-4 py-2.5 text-left font-medium">
                        <span className="inline-flex items-center gap-2">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.employee.color }} aria-hidden="true" />
                          {row.employee.fullName}
                        </span>
                      </th>
                      {row.days.map((day) => (
                        <td key={day.date} className={cn('px-2 py-2.5 text-center align-top', day.date === today && 'bg-muted/60')}>
                          {day.entries.length === 0 ? (
                            <span className="text-faint" aria-label="Nothing">–</span>
                          ) : (
                            <span className="flex flex-col items-center gap-1">
                              {day.entries.map((entry, index) => (
                                <span
                                  key={index}
                                  className={cn(
                                    'rounded-sm px-1.5 py-0.5 text-xs whitespace-nowrap tabular-nums',
                                    entry.type === 'shift' ? 'bg-muted text-foreground' : 'bg-warning/15 text-foreground'
                                  )}
                                >
                                  {entry.text}
                                </span>
                              ))}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-right tabular-nums">{row.hours} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Notice({ title, action, children }: { title: string; action: React.ReactNode; children: React.ReactNode }) {
  return (
    <div role="status" className="flex flex-col gap-3 rounded-md border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <div className="text-sm text-body">{children}</div>
        </div>
      </div>
      <Button asChild size="sm" className="shrink-0">
        {action}
      </Button>
    </div>
  )
}
