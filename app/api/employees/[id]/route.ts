import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { SchedulingBusyError, withSchedulingLock } from '@/lib/appointments/scheduling-lock'
import { connectDB } from '@/lib/mongodb/client'
import { Employee } from '@/lib/mongodb/models/Employee'
import { Calendar } from '@/lib/mongodb/models/Calendar'
import { Appointment } from '@/lib/mongodb/models/Appointment'

const UpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().optional().nullable(),
  color: z.string().optional(),
})

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/employees/[id]'>) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const { id } = await ctx.params
  const employee = await Employee.findOneAndUpdate(
    { _id: id, businessId: auth.businessId },
    parsed.data,
    { new: true }
  )
  if (!employee) return apiError('Not found', 404)
  return apiSuccess(employee)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/employees/[id]'>) {
  const auth = await resolveAuth(_req)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const { id } = await ctx.params
  const employee = await Employee.findOne({ _id: id, businessId: auth.businessId })
  if (!employee) return apiError('Not found', 404)

  const calendars = await Calendar.find({ employeeId: id, businessId: auth.businessId }).select('_id')

  try {
    for (const calendar of calendars) {
      const calendarId = calendar._id.toString()
      await withSchedulingLock(auth.businessId, calendarId, async (lease, session) => {
        await lease.assertOwned()
        await Calendar.updateOne(
          { _id: calendarId, businessId: auth.businessId },
          { $set: { isActive: false } },
          { session: session ?? undefined }
        )
        await Appointment.updateMany(
          {
            calendarId,
            businessId: auth.businessId,
            status: { $in: ['scheduled', 'confirmed'] },
            startTime: { $gte: new Date() },
          },
          { $set: { status: 'cancelled' }, $inc: { __v: 1 } },
          { session: session ?? undefined }
        )
      })
    }

    await Employee.updateOne(
      { _id: id, businessId: auth.businessId },
      { $set: { isActive: false } }
    )
    return apiSuccess({ deleted: true })
  } catch (error) {
    if (error instanceof SchedulingBusyError) return apiError(error.message, 503)
    throw error
  }
}
