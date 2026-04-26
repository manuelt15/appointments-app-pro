import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { Appointment } from '@/lib/mongodb/models/Appointment'
import { Calendar } from '@/lib/mongodb/models/Calendar'

const CreateSchema = z.object({
  title: z.string().min(1),
  clientName: z.string().min(1),
  clientEmail: z.email().optional().nullable(),
  clientPhone: z.string().optional().nullable(),
  clientNotes: z.string().optional().nullable(),
  calendarId: z.string().min(1),
  employeeId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  description: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show']).default('scheduled'),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '100')
  const skip = (page - 1) * limit

  const filter: Record<string, unknown> = { businessId: auth.businessId }
  if (searchParams.get('calendar_id')) filter.calendarId = searchParams.get('calendar_id')
  if (searchParams.get('employee_id')) filter.employeeId = searchParams.get('employee_id')
  if (searchParams.get('room_id')) filter.roomId = searchParams.get('room_id')
  if (searchParams.get('status')) filter.status = searchParams.get('status')
  if (searchParams.get('start')) filter.startTime = { $gte: new Date(searchParams.get('start')!) }
  if (searchParams.get('end')) {
    filter.startTime = { ...(filter.startTime as object), $lte: new Date(searchParams.get('end')!) }
  }

  const [data, total] = await Promise.all([
    Appointment.find(filter).sort({ startTime: 1 }).skip(skip).limit(limit).lean(),
    Appointment.countDocuments(filter),
  ])

  return apiSuccess(data, 200, { total, page, limit })
}

export async function POST(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()

  const calendar = await Calendar.findOne({ _id: parsed.data.calendarId, businessId: auth.businessId })
  if (!calendar) return apiError('Calendar not found', 404)

  const conflict = await Appointment.findOne({
    calendarId: parsed.data.calendarId,
    status: { $ne: 'cancelled' },
    startTime: { $lt: new Date(parsed.data.endTime) },
    endTime: { $gt: new Date(parsed.data.startTime) },
  })
  if (conflict) return apiError('Time slot conflict detected', 409, { conflictId: conflict._id })

  const appointment = await Appointment.create({
    ...parsed.data,
    businessId: auth.businessId,
    startTime: new Date(parsed.data.startTime),
    endTime: new Date(parsed.data.endTime),
  })

  return apiSuccess(appointment, 201)
}
