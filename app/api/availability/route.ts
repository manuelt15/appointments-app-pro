import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import {
  AvailabilityQuerySchema,
  buildCalendarLookup,
} from '@/lib/appointments/availability'
import { buildConflictFilter } from '@/lib/appointments/conflicts'
import { connectDB } from '@/lib/mongodb/client'
import { Appointment } from '@/lib/mongodb/models/Appointment'
import { Calendar } from '@/lib/mongodb/models/Calendar'

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const parsed = AvailabilityQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const calendars = await Calendar.find(buildCalendarLookup(parsed.data, auth.businessId))
    .select('_id')
    .lean()
  if (calendars.length === 0) return apiError('Calendar not found', 404)

  const calendarIds = calendars.map((calendar) => calendar._id.toString())
  const startTime = new Date(parsed.data.start_time)
  const endTime = new Date(parsed.data.end_time)
  const conflicts = await Appointment.find({
    ...buildConflictFilter({
      businessId: auth.businessId,
      calendarId: calendarIds[0],
      startTime,
      endTime,
    }),
    calendarId: { $in: calendarIds },
  })
    .select('_id title startTime endTime status')
    .sort({ startTime: 1, _id: 1 })
    .lean()

  return apiSuccess({
    available: conflicts.length === 0,
    calendarIds,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    conflicts,
  })
}
