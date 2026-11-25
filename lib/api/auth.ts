import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { connectDB } from '@/lib/mongodb/client'
import { ApiKey } from '@/lib/mongodb/models/ApiKey'
import { Business } from '@/lib/mongodb/models/Business'
import { auth } from '@/auth'

export type AuthContext = {
  businessId: string
  userId?: string
  authType: 'session' | 'api_key'
}

const LAST_USED_THROTTLE_MS = 60 * 1000

// Solo las escrituras refrescan `lastUsedAt`. Una lectura no deja rastro: el
// sello delataba cuando alguien consultaba con la clave, y ademas convertia cada
// GET en un write.
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export async function resolveAuth(request: NextRequest): Promise<AuthContext | null> {
  await connectDB()

  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    const keyHash = createHash('sha256').update(apiKey).digest('hex')
    const keyRow = await ApiKey.findOne({ keyHash })
    if (!keyRow) return null
    if (keyRow.expiresAt && keyRow.expiresAt < new Date()) return null
    // lastUsedAt is bookkeeping, not security: writing it on every request
    // turned reads into writes. Only a write refreshes it, at most once a minute.
    const isWrite = !READ_METHODS.has(request.method.toUpperCase())
    if (
      isWrite &&
      (!keyRow.lastUsedAt || Date.now() - keyRow.lastUsedAt.getTime() > LAST_USED_THROTTLE_MS)
    ) {
      await ApiKey.updateOne({ _id: keyRow._id }, { $set: { lastUsedAt: new Date() } })
    }
    return { businessId: keyRow.businessId, authType: 'api_key' }
  }

  const session = await auth()
  if (session?.user?.id) {
    const business = await Business.findOne({ ownerId: session.user.id })
    if (!business) return null
    return { businessId: business._id.toString(), userId: session.user.id, authType: 'session' }
  }

  return null
}
