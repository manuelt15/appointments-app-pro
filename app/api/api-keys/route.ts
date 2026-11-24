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

// A key that never expires cannot be contained if it leaks, so expiry is
// mandatory: 90 days when the client does not ask for one, 365 at most.
const DEFAULT_TTL_DAYS = 90
const MAX_TTL_DAYS = 365
const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const keys = await ApiKey.find({ businessId: auth.businessId }, { keyHash: 0 }).lean()
  return apiSuccess(keys)
}

// Bulk revocation for a leaked key: DELETE /api/api-keys?all=1
export async function DELETE(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)
  if (auth.authType !== 'session') return apiError('Session required to revoke API keys', 403)

  if (request.nextUrl.searchParams.get('all') !== '1') {
    return apiError('Use ?all=1 to revoke every key, or DELETE /api/api-keys/{id} for one', 400)
  }

  await connectDB()
  const result = await ApiKey.deleteMany({ businessId: auth.businessId })
  return apiSuccess({ deleted: result.deletedCount })
}

export async function POST(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) return apiError('Unauthorized', 401)
  // Delegated keys must not mint credentials that survive their own revocation or expiry.
  if (auth.authType !== 'session') return apiError('A signed-in owner session is required', 403)

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const now = new Date()
  const requestedExpiry = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null
  if (requestedExpiry && requestedExpiry.getTime() > now.getTime() + MAX_TTL_DAYS * DAY_MS) {
    return apiError(`expiresAt cannot be more than ${MAX_TTL_DAYS} days from now`, 400)
  }

  const rawKey = `sk_${randomBytes(32).toString('hex')}`
  const keyHash = createHash('sha256').update(rawKey).digest('hex')

  const apiKey = await ApiKey.create({
    businessId: auth.businessId,
    name: parsed.data.name,
    keyHash,
    expiresAt: requestedExpiry ?? new Date(now.getTime() + DEFAULT_TTL_DAYS * DAY_MS),
  })

  return apiSuccess({ ...apiKey.toObject(), key: rawKey }, 201)
}
