import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { SchedulingBusyError, withSchedulingLock } from '@/lib/shifts/scheduling-lock'
import { connectDB } from '@/lib/mongodb/client'
import { Employee, buildEmployeeAnonymization } from '@/lib/mongodb/models/Employee'
import { Shift } from '@/lib/mongodb/models/Shift'
import { isCalendarDate } from '@/lib/shifts/calendar-date'
import { employeeEmail, employeeName } from '@/lib/employees/fields'

const calendarDate = z.string().refine(isCalendarDate, 'Expected a YYYY-MM-DD date')

const UpdateSchema = z.object({
  fullName: employeeName.optional(),
  email: employeeEmail.optional().nullable(),
  phone: z.string().optional().nullable(),
  birthday: calendarDate.optional().nullable(),
  startDate: calendarDate.optional().nullable(),
  color: z.string().optional(),
})

export async function GET(request: NextRequest, ctx: RouteContext<'/api/employees/[id]'>) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const { id } = await ctx.params
  const employee = await Employee.findOne({ _id: id, businessId: auth.businessId }).lean()
  if (!employee) return apiError('Not found', 404)
  return apiSuccess(employee)
}

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

  try {
    // Past shifts stay as history; upcoming ones are dropped with the employee.
    await withSchedulingLock(auth.businessId, id, async (lease, session) => {
      await lease.assertOwned()
      await Shift.deleteMany(
        {
          employeeId: id,
          businessId: auth.businessId,
          startTime: { $gte: new Date() },
        },
        { session: session ?? undefined }
      )
    })

    // Logical delete. The row stays because past shifts reference it, but the
    // personal data goes: email, phone and birthday are cleared and the moment is
    // recorded in anonymizedAt (see buildEmployeeAnonymization).
    await Employee.updateOne(
      { _id: id, businessId: auth.businessId },
      buildEmployeeAnonymization(),
      // Mongoose needs to be told an array is a pipeline, not a list of updates.
      { updatePipeline: true }
    )
    return apiSuccess({ deleted: true })
  } catch (error) {
    if (error instanceof SchedulingBusyError) return apiError(error.message, 503)
    throw error
  }
}
