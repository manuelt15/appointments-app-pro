import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { CoverageQuerySchema, buildCoverageFilter } from '@/lib/shifts/availability'
import { connectDB } from '@/lib/mongodb/client'
import { Employee } from '@/lib/mongodb/models/Employee'
import { Shift } from '@/lib/mongodb/models/Shift'

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const parsed = CoverageQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const shifts = await Shift.find(buildCoverageFilter(parsed.data, auth.businessId))
    .sort({ startTime: 1, _id: 1 })
    .lean()

  const employees = await Employee.find({ businessId: auth.businessId }).lean()
  const employeeMap = Object.fromEntries(employees.map((e) => [e._id.toString(), e]))

  const working = shifts.filter((shift) => shift.type === 'shift')

  return apiSuccess({
    startTime: new Date(parsed.data.start_time).toISOString(),
    endTime: new Date(parsed.data.end_time).toISOString(),
    covered: working.length > 0,
    working: working.map((shift) => ({
      shiftId: shift._id.toString(),
      employeeId: shift.employeeId,
      employeeName: employeeMap[shift.employeeId]?.fullName,
      startTime: shift.startTime,
      endTime: shift.endTime,
    })),
    away: shifts
      .filter((shift) => shift.type !== 'shift')
      .map((shift) => ({
        shiftId: shift._id.toString(),
        employeeId: shift.employeeId,
        employeeName: employeeMap[shift.employeeId]?.fullName,
        type: shift.type,
      })),
  })
}
