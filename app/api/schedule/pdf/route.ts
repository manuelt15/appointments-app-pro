import { NextRequest } from 'next/server'
import { addDays } from 'date-fns'
import { resolveAuth } from '@/lib/api/auth'
import { apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { Business } from '@/lib/mongodb/models/Business'
import { Employee } from '@/lib/mongodb/models/Employee'
import { Shift } from '@/lib/mongodb/models/Shift'
import { buildSchedulePdf } from '@/lib/schedule/pdf'
import { toPlainEmployee, toPlainShift } from '@/lib/schedule/serialize'
import { buildEmployeeWeeks, resolveWeekStart } from '@/lib/schedule/week'

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const weekStart = resolveWeekStart(new URL(request.url).searchParams.get('week'))
  const weekEnd = addDays(weekStart, 7)

  const [business, employees, shifts] = await Promise.all([
    Business.findById(auth.businessId).select('name').lean<{ name: string }>(),
    Employee.find({ businessId: auth.businessId, isActive: true }).lean(),
    Shift.find({
      businessId: auth.businessId,
      startTime: { $lt: weekEnd },
      endTime: { $gt: weekStart },
    }).lean(),
  ])

  const weeks = buildEmployeeWeeks(
    employees.map(toPlainEmployee),
    shifts.map(toPlainShift),
    weekStart
  )
  const pdf = await buildSchedulePdf(business?.name ?? 'Schedule', weekStart, weeks)
  const fileName = `schedule-${weekStart.toISOString().slice(0, 10)}.pdf`

  return new Response(pdf as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
