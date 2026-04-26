import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { apiSuccess, apiError } from '@/lib/api/response'
import { connectDB } from '@/lib/mongodb/client'
import { Business } from '@/lib/mongodb/models/Business'
import { slugify } from '@/lib/utils'

const CreateSchema = z.object({
  name: z.string().min(1),
  timezone: z.string().default('Europe/Madrid'),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  await connectDB()
  const existing = await Business.findOne({ ownerId: session.user.id })
  if (existing) return apiError('Business already exists', 409)

  const baseSlug = slugify(parsed.data.name)
  const count = await Business.countDocuments({ slug: new RegExp(`^${baseSlug}`) })
  const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`

  const business = await Business.create({
    ownerId: session.user.id,
    name: parsed.data.name,
    timezone: parsed.data.timezone,
    slug,
  })

  return apiSuccess(business, 201)
}
