import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { Calendar } from '@/lib/mongodb/models/Calendar'
import { Employee } from '@/lib/mongodb/models/Employee'
import { Room } from '@/lib/mongodb/models/Room'

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const includeId = new URL(request.url).searchParams.get('include_id')
  if (includeId && !/^[a-f\d]{24}$/i.test(includeId)) return apiError('Invalid calendar ID', 400)

  await connectDB()
  const calendars = await Calendar.find({
    businessId: auth.businessId,
    ...(includeId ? { $or: [{ isActive: true }, { _id: includeId }] } : { isActive: true }),
  }).lean()

  const [employees, rooms] = await Promise.all([
    Employee.find({ businessId: auth.businessId }).lean(),
    Room.find({ businessId: auth.businessId }).lean(),
  ])

  const employeeMap = Object.fromEntries(employees.map((e) => [e._id.toString(), e]))
  const roomMap = Object.fromEntries(rooms.map((r) => [r._id.toString(), r]))

  const enriched = calendars.map((c) => ({
    ...c,
    employee: c.employeeId ? employeeMap[c.employeeId] : undefined,
    room: c.roomId ? roomMap[c.roomId] : undefined,
  }))

  return apiSuccess(enriched)
}
