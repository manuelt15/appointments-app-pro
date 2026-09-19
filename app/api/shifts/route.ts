import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { buildConflictFilter } from '@/lib/shifts/conflicts'
import { ShiftListQuerySchema, buildShiftListFilter } from '@/lib/shifts/list-query'
import { SchedulingBusyError, withSchedulingLock } from '@/lib/shifts/scheduling-lock'
import { CreateShiftSchema } from '@/lib/shifts/validation'
import { connectDB } from '@/lib/mongodb/client'
import { Employee } from '@/lib/mongodb/models/Employee'
import { Shift } from '@/lib/mongodb/models/Shift'

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const parsed = ShiftListQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const { page, limit } = parsed.data
  const skip = (page - 1) * limit
  const filter = buildShiftListFilter(parsed.data, auth.businessId)

  const [data, total] = await Promise.all([
    Shift.find(filter).sort({ startTime: 1, _id: 1 }).skip(skip).limit(limit).lean(),
    Shift.countDocuments(filter),
  ])

  return apiSuccess(data, 200, { total, page, limit })
}

export async function POST(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = CreateShiftSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()

  try {
    const result = await withSchedulingLock(auth.businessId, parsed.data.employeeId, async (lease, session) => {
      const employee = await Employee.findOne({
        _id: parsed.data.employeeId,
        businessId: auth.businessId,
        isActive: true,
      }).session(session)
      if (!employee) return { kind: 'employeeNotFound' as const }

      const conflict = await Shift.findOne(buildConflictFilter({
        businessId: auth.businessId,
        employeeId: parsed.data.employeeId,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
      })).session(session)
      if (conflict) return { kind: 'conflict' as const, conflictId: conflict._id.toString() }

      await lease.assertOwned()
      const shift = new Shift({
        ...parsed.data,
        businessId: auth.businessId,
        startTime: new Date(parsed.data.startTime),
        endTime: new Date(parsed.data.endTime),
      })
      await shift.save({ session: session ?? undefined })
      return { kind: 'created' as const, shift }
    })

    if (result.kind === 'employeeNotFound') return apiError('Employee not found', 404)
    if (result.kind === 'conflict') {
      return apiError('This employee already has a shift in that range', 409, { conflictId: result.conflictId })
    }
    return apiSuccess(result.shift, 201)
  } catch (error) {
    if (error instanceof SchedulingBusyError) return apiError(error.message, 503)
    throw error
  }
}
