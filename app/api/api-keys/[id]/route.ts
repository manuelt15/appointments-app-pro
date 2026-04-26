import { NextRequest } from 'next/server'
import { resolveAuth } from '@/lib/api/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { ApiKey } from '@/lib/mongodb/models/ApiKey'

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/api-keys/[id]'>) {
  const auth = await resolveAuth(_req)
  if (!auth) return apiError('Unauthorized', 401)

  await connectDB()
  const { id } = await ctx.params
  const key = await ApiKey.findOneAndDelete({ _id: id, businessId: auth.businessId })
  if (!key) return apiError('Not found', 404)
  return apiSuccess({ deleted: true })
}
