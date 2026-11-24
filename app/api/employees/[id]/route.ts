import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { requestLocale } from '@/lib/i18n/request'
import { t } from '@/lib/i18n/translate'
import { SchedulingBusyError, withSchedulingLock } from '@/lib/shifts/scheduling-lock'
import { canonicalEmployeeId, employeeIdParam } from '@/lib/shifts/validation'
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

/**
 * A malformed id cannot name an employee. It is rejected before any query
 * instead of being handed to Mongo, whose cast error would surface as a 500.
 */
async function parseEmployeeId(ctx: RouteContext<'/api/employees/[id]'>) {
  const { id } = await ctx.params
  const parsed = employeeIdParam.safeParse(id)
  return parsed.success ? parsed.data : null
}

export async function GET(request: NextRequest, ctx: RouteContext<'/api/employees/[id]'>) {
  const locale = requestLocale(request)
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const employeeId = await parseEmployeeId(ctx)
  if (!employeeId) return apiError(t(locale, 'shifts.error.notFound'), 404)

  await connectDB()
  const employee = await Employee.findOne({ _id: employeeId, businessId: auth.businessId }).lean()
  if (!employee) return apiError(t(locale, 'shifts.error.notFound'), 404)
  return apiSuccess(employee)
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/employees/[id]'>) {
  const locale = requestLocale(request)
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return apiError(t(locale, 'shifts.error.validation'), 400, parsed.error.flatten())

  const employeeId = await parseEmployeeId(ctx)
  if (!employeeId) return apiError(t(locale, 'shifts.error.notFound'), 404)

  await connectDB()
  const employee = await Employee.findOneAndUpdate(
    { _id: employeeId, businessId: auth.businessId },
    parsed.data,
    { new: true }
  )
  if (!employee) return apiError(t(locale, 'shifts.error.notFound'), 404)
  return apiSuccess(employee)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/employees/[id]'>) {
  const locale = requestLocale(_req)
  const auth = await resolveAuth(_req)
  if (!auth) return apiError('Unauthorized', 401)

  const employeeId = await parseEmployeeId(ctx)
  if (!employeeId) return apiError(t(locale, 'shifts.error.notFound'), 404)

  await connectDB()
  const employee = await Employee.findOne({ _id: employeeId, businessId: auth.businessId })
  if (!employee) return apiError(t(locale, 'shifts.error.notFound'), 404)

  // Mongo casts the _id argument and matches it case-insensitively, but
  // Shift.employeeId and the scheduling lock key are plain strings: the key has
  // to come from the employee that was actually resolved, so two spellings of
  // the same id cannot lock or delete as two different people.
  const lockEmployeeId = canonicalEmployeeId(employee._id.toString())

  try {
    // Past shifts stay as history; upcoming ones are dropped with the employee.
    await withSchedulingLock(auth.businessId, lockEmployeeId, async (lease, session) => {
      await lease.assertOwned()
      await Shift.deleteMany(
        {
          employeeId: lockEmployeeId,
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
      { _id: lockEmployeeId, businessId: auth.businessId },
      buildEmployeeAnonymization(),
      // Mongoose needs to be told an array is a pipeline, not a list of updates.
      { updatePipeline: true }
    )
    return apiSuccess({ deleted: true })
  } catch (error) {
    if (error instanceof SchedulingBusyError) return apiError(t(locale, 'shifts.error.busy'), 503)
    throw error
  }
}
