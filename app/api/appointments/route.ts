import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { buildConflictFilter } from '@/lib/appointments/conflicts'
import {
  AppointmentListQuerySchema,
  buildAppointmentListFilter,
} from '@/lib/appointments/list-query'
import { SchedulingBusyError, withSchedulingLock } from '@/lib/appointments/scheduling-lock'
import { CreateAppointmentSchema } from '@/lib/appointments/validation'
import { connectDB } from '@/lib/mongodb/client'
import { Appointment } from '@/lib/mongodb/models/Appointment'
import { Calendar } from '@/lib/mongodb/models/Calendar'

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const parsed = AppointmentListQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const { page, limit } = parsed.data
  const skip = (page - 1) * limit
  const filter = buildAppointmentListFilter(parsed.data, auth.businessId)

  const [data, total] = await Promise.all([
    Appointment.find(filter).sort({ startTime: 1, _id: 1 }).skip(skip).limit(limit).lean(),
    Appointment.countDocuments(filter),
  ])

  return apiSuccess(data, 200, { total, page, limit })
}

export async function POST(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = CreateAppointmentSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()

  try {
    const result = await withSchedulingLock(auth.businessId, parsed.data.calendarId, async (lease, session) => {
      const calendar = await Calendar.findOne({
        _id: parsed.data.calendarId,
        businessId: auth.businessId,
        isActive: true,
      }).session(session)
      if (!calendar) return { kind: 'calendarNotFound' as const }

      const conflict = await Appointment.findOne(buildConflictFilter({
        businessId: auth.businessId,
        calendarId: parsed.data.calendarId,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
      })).session(session)
      if (conflict) return { kind: 'conflict' as const, conflictId: conflict._id.toString() }

      await lease.assertOwned()
      const appointment = new Appointment({
        ...parsed.data,
        businessId: auth.businessId,
        employeeId: calendar.employeeId,
        roomId: calendar.roomId,
        startTime: new Date(parsed.data.startTime),
        endTime: new Date(parsed.data.endTime),
      })
      await appointment.save({ session: session ?? undefined })
      return { kind: 'created' as const, appointment }
    })

    if (result.kind === 'calendarNotFound') return apiError('Calendar not found', 404)
    if (result.kind === 'conflict') {
      return apiError('Time slot conflict detected', 409, { conflictId: result.conflictId })
    }
    return apiSuccess(result.appointment, 201)
  } catch (error) {
    if (error instanceof SchedulingBusyError) return apiError(error.message, 503)
    throw error
  }
}
