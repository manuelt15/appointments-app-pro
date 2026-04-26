import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { Appointment } from '@/lib/mongodb/models/Appointment'

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().optional().nullable(),
  clientPhone: z.string().optional().nullable(),
  clientNotes: z.string().optional().nullable(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/appointments/[id]'>) {
  const auth = await resolveAuth(_req)
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
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const { id } = await ctx.params

  const update: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.startTime) update.startTime = new Date(parsed.data.startTime)
  if (parsed.data.endTime) update.endTime = new Date(parsed.data.endTime)

  const appointment = await Appointment.findOneAndUpdate(
    { _id: id, businessId: auth.businessId },
    update,
    { new: true }
  )
  if (!appointment) return apiError('Not found', 404)
  return apiSuccess(appointment)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/appointments/[id]'>) {
  const auth = await resolveAuth(_req)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const { id } = await ctx.params
  const { searchParams } = new URL(_req.url)
  const hard = searchParams.get('hard') === 'true'

  if (hard) {
    await Appointment.findOneAndDelete({ _id: id, businessId: auth.businessId })
  } else {
    await Appointment.findOneAndUpdate(
      { _id: id, businessId: auth.businessId },
      { status: 'cancelled' }
    )
  }

  return apiSuccess({ deleted: true })
}
