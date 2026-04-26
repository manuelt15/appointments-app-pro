import { NextRequest } from 'next/server'
import { z } from 'zod'
import { randomBytes, createHash } from 'crypto'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { ApiKey } from '@/lib/mongodb/models/ApiKey'

const CreateSchema = z.object({
  name: z.string().min(1),
  expiresAt: z.string().datetime().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const keys = await ApiKey.find({ businessId: auth.businessId }, { keyHash: 0 }).lean()
  return apiSuccess(keys)
}

export async function POST(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const rawKey = `sk_${randomBytes(32).toString('hex')}`
  const keyHash = createHash('sha256').update(rawKey).digest('hex')

  const apiKey = await ApiKey.create({
    businessId: auth.businessId,
    name: parsed.data.name,
    keyHash,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
  })

  return apiSuccess({ ...apiKey.toObject(), key: rawKey }, 201)
}
