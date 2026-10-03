import { NextRequest } from 'next/server'
import moment from 'moment-timezone'
import { resolveAuth } from '@/lib/api/auth'
import { apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { Business } from '@/lib/mongodb/models/Business'
import { Employee } from '@/lib/mongodb/models/Employee'
import { Shift } from '@/lib/mongodb/models/Shift'
import { buildSchedulePdf } from '@/lib/schedule/pdf'
import { toPlainEmployee, toPlainShift } from '@/lib/schedule/serialize'
import { buildEmployeeWeeks, resolveWeekStart, weekEnd } from '@/lib/schedule/week'

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const business = await Business.findById(auth.businessId)
    .select('name timezone')
    .lean<{ name: string; timezone?: string }>()
  const timeZone = business?.timezone ?? 'Europe/Madrid'
  const weekStart = resolveWeekStart(new URL(request.url).searchParams.get('week'), timeZone)
  const end = weekEnd(weekStart, timeZone)

  const [employees, shifts] = await Promise.all([
    Employee.find({ businessId: auth.businessId, isActive: true }).lean(),
    Shift.find({
      businessId: auth.businessId,
      startTime: { $lt: end },
      endTime: { $gt: weekStart },
    }).lean(),
  ])

  const weeks = buildEmployeeWeeks(
    employees.map(toPlainEmployee),
    shifts.map(toPlainShift),
    weekStart,
    timeZone
  )
  const pdf = await buildSchedulePdf(business?.name ?? 'Schedule', weekStart, timeZone, weeks)
  const fileName = `schedule-${moment(weekStart).tz(timeZone).format('YYYY-MM-DD')}.pdf`

  return new Response(pdf as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
