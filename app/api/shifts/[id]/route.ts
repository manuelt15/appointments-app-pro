import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { requestLocale } from '@/lib/i18n/request'
import { t } from '@/lib/i18n/translate'
import { buildConflictFilter } from '@/lib/shifts/conflicts'
import { SchedulingBusyError, withSchedulingLock } from '@/lib/shifts/scheduling-lock'
import { canonicalEmployeeId, isValidTimeRange, UpdateShiftSchema } from '@/lib/shifts/validation'
import { connectDB } from '@/lib/mongodb/client'
import { Employee } from '@/lib/mongodb/models/Employee'
import { Shift } from '@/lib/mongodb/models/Shift'

export async function GET(request: NextRequest, ctx: RouteContext<'/api/shifts/[id]'>) {
  const locale = requestLocale(request)
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const { id } = await ctx.params
  const shift = await Shift.findOne({ _id: id, businessId: auth.businessId }).lean()
  if (!shift) return apiError(t(locale, 'shifts.error.notFound'), 404)
  return apiSuccess(shift)
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/shifts/[id]'>) {
  const locale = requestLocale(request)
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = UpdateShiftSchema.safeParse(body)
  if (!parsed.success) return apiError(t(locale, 'shifts.error.validation'), 400, parsed.error.flatten())

  await connectDB()
  const { id } = await ctx.params
  const initial = await Shift.findOne({ _id: id, businessId: auth.businessId }).select('employeeId')
  if (!initial) return apiError(t(locale, 'shifts.error.notFound'), 404)

  const lockEmployeeId = parsed.data.employeeId ?? canonicalEmployeeId(initial.employeeId)

  try {
    const result = await withSchedulingLock(auth.businessId, lockEmployeeId, async (lease, session) => {
      const current = await Shift.findOne({ _id: id, businessId: auth.businessId }).session(session)
      if (!current) return { kind: 'notFound' as const }

      const employeeId = parsed.data.employeeId ?? canonicalEmployeeId(current.employeeId)
      if (employeeId !== lockEmployeeId) return { kind: 'stale' as const }

      const startTime = parsed.data.startTime ? new Date(parsed.data.startTime) : current.startTime
      const endTime = parsed.data.endTime ? new Date(parsed.data.endTime) : current.endTime
      if (!isValidTimeRange(startTime, endTime)) return { kind: 'invalidRange' as const }

      const employee = await Employee.findOne({
        _id: employeeId,
        businessId: auth.businessId,
        isActive: true,
      }).session(session)
      if (!employee) return { kind: 'employeeNotFound' as const }

      // Shift.employeeId is a String while the lookup casts _id to ObjectId:
      // persist the resolved employee's canonical id so a row saved before this
      // fix stops being a second identity for the same person.
      const canonicalId = employee._id.toString()

      const conflict = await Shift.findOne(buildConflictFilter({
        businessId: auth.businessId,
        employeeId: canonicalId,
        startTime,
        endTime,
        excludeShiftId: id,
      })).session(session)
      if (conflict) return { kind: 'conflict' as const, conflictId: conflict._id.toString() }

      await lease.assertOwned()
      const shift = await Shift.findOneAndUpdate(
        { _id: id, businessId: auth.businessId, __v: current.__v },
        {
          $set: { ...parsed.data, employeeId: canonicalId, startTime, endTime },
          $inc: { __v: 1 },
        },
        { new: true, session }
      )
      if (!shift) return { kind: 'stale' as const }
      return { kind: 'updated' as const, shift }
    })

    if (result.kind === 'notFound') return apiError(t(locale, 'shifts.error.notFound'), 404)
    if (result.kind === 'employeeNotFound') return apiError(t(locale, 'shifts.error.employeeNotFound'), 404)
    if (result.kind === 'invalidRange') return apiError(t(locale, 'shifts.error.endAfterStart'), 400)
    if (result.kind === 'stale') return apiError(t(locale, 'shifts.error.stale'), 409)
    if (result.kind === 'conflict') {
      return apiError(t(locale, 'shifts.error.conflict'), 409, { conflictId: result.conflictId })
    }
    return apiSuccess(result.shift)
  } catch (error) {
    if (error instanceof SchedulingBusyError) return apiError(t(locale, 'shifts.error.busy'), 503)
    throw error
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext<'/api/shifts/[id]'>) {
  const locale = requestLocale(request)
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const { id } = await ctx.params
  const initial = await Shift.findOne({ _id: id, businessId: auth.businessId }).select('employeeId')
  if (!initial) return apiError(t(locale, 'shifts.error.notFound'), 404)

  try {
    const result = await withSchedulingLock(auth.businessId, canonicalEmployeeId(initial.employeeId), async (lease, session) => {
      const current = await Shift.findOne({ _id: id, businessId: auth.businessId }).session(session)
      if (!current) return { kind: 'notFound' as const }

      await lease.assertOwned()
      const deleted = await Shift.deleteOne(
        { _id: id, businessId: auth.businessId, __v: current.__v },
        { session: session ?? undefined }
      )
      return deleted.deletedCount === 1 ? { kind: 'deleted' as const } : { kind: 'stale' as const }
    })

    if (result.kind === 'notFound') return apiError(t(locale, 'shifts.error.notFound'), 404)
    if (result.kind === 'stale') return apiError(t(locale, 'shifts.error.stale'), 409)
    return apiSuccess({ deleted: true })
  } catch (error) {
    if (error instanceof SchedulingBusyError) return apiError(t(locale, 'shifts.error.busy'), 503)
    throw error
  }
}
