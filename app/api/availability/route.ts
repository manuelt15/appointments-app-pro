import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { Appointment } from '@/lib/mongodb/models/Appointment'

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const calendarId = searchParams.get('calendar_id')
  const date = searchParams.get('date')

  if (!calendarId || !date) return apiError('calendar_id and date are required', 400)

  await connectDB()
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const booked = await Appointment.find({
    calendarId,
    businessId: auth.businessId,
    status: { $ne: 'cancelled' },
    startTime: { $gte: dayStart, $lte: dayEnd },
  }).lean()

  return apiSuccess(booked)
}
