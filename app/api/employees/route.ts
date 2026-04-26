import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { Employee } from '@/lib/mongodb/models/Employee'
import { Calendar } from '@/lib/mongodb/models/Calendar'

const CreateSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().optional().nullable(),
  color: z.string().default('#6366f1'),
})

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const employees = await Employee.find({ businessId: auth.businessId, isActive: true }).lean()
  return apiSuccess(employees)
}

export async function POST(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const employee = await Employee.create({ ...parsed.data, businessId: auth.businessId })

  // Auto-create calendar (replaces DB trigger)
  await Calendar.create({
    businessId: auth.businessId,
    name: `${employee.fullName}'s Calendar`,
    employeeId: employee._id.toString(),
  })

  return apiSuccess(employee, 201)
}
