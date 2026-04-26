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

export async function resolveAuth(request: NextRequest): Promise<AuthContext | null> {
  await connectDB()

  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    const keyHash = createHash('sha256').update(apiKey).digest('hex')
    const keyRow = await ApiKey.findOne({ keyHash })
    if (!keyRow) return null
    if (keyRow.expiresAt && keyRow.expiresAt < new Date()) return null
    await ApiKey.findByIdAndUpdate(keyRow._id, { lastUsedAt: new Date() })
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
