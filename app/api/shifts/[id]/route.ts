import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { buildConflictFilter } from '@/lib/shifts/conflicts'
import { SchedulingBusyError, withSchedulingLock } from '@/lib/shifts/scheduling-lock'
import { isValidTimeRange, UpdateShiftSchema } from '@/lib/shifts/validation'
import { connectDB } from '@/lib/mongodb/client'
import { Employee } from '@/lib/mongodb/models/Employee'
import { Shift } from '@/lib/mongodb/models/Shift'

export async function GET(request: NextRequest, ctx: RouteContext<'/api/shifts/[id]'>) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const { id } = await ctx.params
  const shift = await Shift.findOne({ _id: id, businessId: auth.businessId }).lean()
  if (!shift) return apiError('Not found', 404)
  return apiSuccess(shift)
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/shifts/[id]'>) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = UpdateShiftSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const { id } = await ctx.params
  const initial = await Shift.findOne({ _id: id, businessId: auth.businessId }).select('employeeId')
  if (!initial) return apiError('Not found', 404)

  const lockEmployeeId = parsed.data.employeeId ?? initial.employeeId

  try {
    const result = await withSchedulingLock(auth.businessId, lockEmployeeId, async (lease, session) => {
      const current = await Shift.findOne({ _id: id, businessId: auth.businessId }).session(session)
      if (!current) return { kind: 'notFound' as const }

      const employeeId = parsed.data.employeeId ?? current.employeeId
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

      const conflict = await Shift.findOne(buildConflictFilter({
        businessId: auth.businessId,
        employeeId,
        startTime,
        endTime,
        excludeShiftId: id,
      })).session(session)
      if (conflict) return { kind: 'conflict' as const, conflictId: conflict._id.toString() }

      await lease.assertOwned()
      const shift = await Shift.findOneAndUpdate(
        { _id: id, businessId: auth.businessId, __v: current.__v },
        {
          $set: { ...parsed.data, employeeId, startTime, endTime },
          $inc: { __v: 1 },
        },
        { new: true, session }
      )
      if (!shift) return { kind: 'stale' as const }
      return { kind: 'updated' as const, shift }
    })

    if (result.kind === 'notFound') return apiError('Not found', 404)
    if (result.kind === 'employeeNotFound') return apiError('Employee not found', 404)
    if (result.kind === 'invalidRange') return apiError('End time must be after start time', 400)
    if (result.kind === 'stale') return apiError('Shift changed. Refresh and try again.', 409)
    if (result.kind === 'conflict') {
      return apiError('This employee already has a shift in that range', 409, { conflictId: result.conflictId })
    }
    return apiSuccess(result.shift)
  } catch (error) {
    if (error instanceof SchedulingBusyError) return apiError(error.message, 503)
    throw error
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext<'/api/shifts/[id]'>) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const { id } = await ctx.params
  const initial = await Shift.findOne({ _id: id, businessId: auth.businessId }).select('employeeId')
  if (!initial) return apiError('Not found', 404)

  try {
    const result = await withSchedulingLock(auth.businessId, initial.employeeId, async (lease, session) => {
      const current = await Shift.findOne({ _id: id, businessId: auth.businessId }).session(session)
      if (!current) return { kind: 'notFound' as const }

      await lease.assertOwned()
      const deleted = await Shift.deleteOne(
        { _id: id, businessId: auth.businessId, __v: current.__v },
        { session: session ?? undefined }
      )
      return deleted.deletedCount === 1 ? { kind: 'deleted' as const } : { kind: 'stale' as const }
    })

    if (result.kind === 'notFound') return apiError('Not found', 404)
    if (result.kind === 'stale') return apiError('Shift changed. Refresh and try again.', 409)
    return apiSuccess({ deleted: true })
  } catch (error) {
    if (error instanceof SchedulingBusyError) return apiError(error.message, 503)
    throw error
  }
}
