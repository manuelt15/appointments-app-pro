import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { Room } from '@/lib/mongodb/models/Room'
import { Calendar } from '@/lib/mongodb/models/Calendar'

const CreateSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().int().min(1).default(1),
  color: z.string().default('#10b981'),
})

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const rooms = await Room.find({ businessId: auth.businessId, isActive: true }).lean()
  return apiSuccess(rooms)
}

export async function POST(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const room = await Room.create({ ...parsed.data, businessId: auth.businessId })

  // Auto-create calendar (replaces DB trigger)
  await Calendar.create({
    businessId: auth.businessId,
    name: `${room.name} Calendar`,
    roomId: room._id.toString(),
  })

  return apiSuccess(room, 201)
}
