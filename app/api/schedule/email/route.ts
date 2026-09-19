import { NextRequest } from 'next/server'
import { addDays } from 'date-fns'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { Business } from '@/lib/mongodb/models/Business'
import { Employee } from '@/lib/mongodb/models/Employee'
import { Shift } from '@/lib/mongodb/models/Shift'
import {
  EmailProviderNotConfigured,
  isEmailConfigured,
  prepareWeeklyEmails,
  sendEmail,
} from '@/lib/schedule/email'
import { toPlainEmployee, toPlainShift } from '@/lib/schedule/serialize'
import { buildEmployeeWeeks, resolveWeekStart } from '@/lib/schedule/week'

export async function POST(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json().catch(() => ({}))
  await connectDB()
  const weekStart = resolveWeekStart(body?.week ?? null)
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
  const { ready, skipped } = prepareWeeklyEmails(business?.name ?? 'the team', weekStart, weeks)

  if (!isEmailConfigured()) {
    return apiSuccess({
      sent: 0,
      prepared: ready.length,
      skipped,
      recipients: ready.map((message) => ({ name: message.employeeName, to: message.to })),
      configured: false,
    })
  }

  const failed: { employeeName: string; reason: string }[] = []
  let sent = 0

  for (const message of ready) {
    try {
      await sendEmail(message)
      sent += 1
    } catch (error) {
      if (error instanceof EmailProviderNotConfigured) {
        return apiError('No email provider is configured yet.', 503)
      }
      failed.push({
        employeeName: message.employeeName,
        reason: error instanceof Error ? error.message : 'Delivery failed',
      })
    }
  }

  return apiSuccess({ sent, prepared: ready.length, skipped, failed, configured: true })
}
