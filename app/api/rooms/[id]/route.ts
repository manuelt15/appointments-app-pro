import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { Room } from '@/lib/mongodb/models/Room'
import { Calendar } from '@/lib/mongodb/models/Calendar'
import { Appointment } from '@/lib/mongodb/models/Appointment'

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  color: z.string().optional(),
})

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/rooms/[id]'>) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const { id } = await ctx.params
  const room = await Room.findOneAndUpdate(
    { _id: id, businessId: auth.businessId },
    parsed.data,
    { new: true }
  )
  if (!room) return apiError('Not found', 404)
  return apiSuccess(room)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/rooms/[id]'>) {
  const auth = await resolveAuth(_req)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const { id } = await ctx.params
  const room = await Room.findOneAndUpdate(
    { _id: id, businessId: auth.businessId },
    { isActive: false }
  )
  if (!room) return apiError('Not found', 404)

  await Calendar.updateMany({ roomId: id, businessId: auth.businessId }, { isActive: false })
  await Appointment.updateMany(
    { roomId: id, businessId: auth.businessId, status: 'scheduled' },
    { status: 'cancelled' }
  )

  return apiSuccess({ deleted: true })
}
