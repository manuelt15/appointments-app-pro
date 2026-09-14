import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { buildConflictFilter } from '@/lib/appointments/conflicts'
import { SchedulingBusyError, withSchedulingLock } from '@/lib/appointments/scheduling-lock'
import { isValidTimeRange, UpdateAppointmentSchema } from '@/lib/appointments/validation'
import { connectDB } from '@/lib/mongodb/client'
import { Appointment } from '@/lib/mongodb/models/Appointment'
import { Calendar } from '@/lib/mongodb/models/Calendar'

export async function GET(request: NextRequest, ctx: RouteContext<'/api/appointments/[id]'>) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const { id } = await ctx.params
  const appointment = await Appointment.findOne({ _id: id, businessId: auth.businessId }).lean()
  if (!appointment) return apiError('Not found', 404)
  return apiSuccess(appointment)
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/appointments/[id]'>) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = UpdateAppointmentSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const { id } = await ctx.params
  const initial = await Appointment.findOne({ _id: id, businessId: auth.businessId }).select('calendarId')
  if (!initial) return apiError('Not found', 404)

  const lockCalendarId = parsed.data.calendarId ?? initial.calendarId

  try {
    const result = await withSchedulingLock(auth.businessId, lockCalendarId, async (lease, session) => {
      const current = await Appointment.findOne({ _id: id, businessId: auth.businessId }).session(session)
      if (!current) return { kind: 'notFound' as const }

      const calendarId = parsed.data.calendarId ?? current.calendarId
      if (calendarId !== lockCalendarId) return { kind: 'stale' as const }

      const startTime = parsed.data.startTime ? new Date(parsed.data.startTime) : current.startTime
      const endTime = parsed.data.endTime ? new Date(parsed.data.endTime) : current.endTime
      if (!isValidTimeRange(startTime, endTime)) return { kind: 'invalidRange' as const }

      const status = parsed.data.status ?? current.status
      const calendar = await Calendar.findOne({ _id: calendarId, businessId: auth.businessId }).session(session)
      if (!calendar || (status !== 'cancelled' && !calendar.isActive)) {
        return { kind: 'calendarNotFound' as const }
      }

      if (status !== 'cancelled') {
        const conflict = await Appointment.findOne(buildConflictFilter({
          businessId: auth.businessId,
          calendarId,
          startTime,
          endTime,
          excludeAppointmentId: id,
        })).session(session)
        if (conflict) return { kind: 'conflict' as const, conflictId: conflict._id.toString() }
      }

      await lease.assertOwned()
      const appointment = await Appointment.findOneAndUpdate(
        { _id: id, businessId: auth.businessId, __v: current.__v },
        {
          $set: {
            ...parsed.data,
            calendarId,
            employeeId: calendar.employeeId,
            roomId: calendar.roomId,
            startTime,
            endTime,
          },
          $inc: { __v: 1 },
        },
        { new: true, session }
      )
      if (!appointment) return { kind: 'stale' as const }
      return { kind: 'updated' as const, appointment }
    })

    if (result.kind === 'notFound') return apiError('Not found', 404)
    if (result.kind === 'calendarNotFound') return apiError('Calendar not found', 404)
    if (result.kind === 'invalidRange') return apiError('End time must be after start time', 400)
    if (result.kind === 'stale') return apiError('Appointment changed. Refresh and try again.', 409)
    if (result.kind === 'conflict') {
      return apiError('Time slot conflict detected', 409, { conflictId: result.conflictId })
    }
    return apiSuccess(result.appointment)
  } catch (error) {
    if (error instanceof SchedulingBusyError) return apiError(error.message, 503)
    throw error
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext<'/api/appointments/[id]'>) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const { id } = await ctx.params
  const { searchParams } = new URL(request.url)
  const hard = searchParams.get('hard') === 'true'
  const initial = await Appointment.findOne({ _id: id, businessId: auth.businessId }).select('calendarId')
  if (!initial) return apiError('Not found', 404)

  try {
    const result = await withSchedulingLock(auth.businessId, initial.calendarId, async (lease, session) => {
      const current = await Appointment.findOne({ _id: id, businessId: auth.businessId }).session(session)
      if (!current) return { kind: 'notFound' as const }

      await lease.assertOwned()
      if (hard) {
        const deleted = await Appointment.deleteOne(
          { _id: id, businessId: auth.businessId, __v: current.__v },
          { session: session ?? undefined }
        )
        return deleted.deletedCount === 1 ? { kind: 'deleted' as const } : { kind: 'stale' as const }
      }

      const appointment = await Appointment.findOneAndUpdate(
        { _id: id, businessId: auth.businessId, __v: current.__v },
        { $set: { status: 'cancelled' }, $inc: { __v: 1 } },
        { new: true, session }
      )
      return appointment ? { kind: 'deleted' as const } : { kind: 'stale' as const }
    })

    if (result.kind === 'notFound') return apiError('Not found', 404)
    if (result.kind === 'stale') return apiError('Appointment changed. Refresh and try again.', 409)
    return apiSuccess({ deleted: true })
  } catch (error) {
    if (error instanceof SchedulingBusyError) return apiError(error.message, 503)
    throw error
  }
}
