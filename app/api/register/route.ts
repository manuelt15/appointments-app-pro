import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { apiSuccess, apiError } from '@/lib/api/response'
import { clientPromise } from '@/lib/mongodb/client'

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 400, parsed.error.flatten())

  const client = await clientPromise
  const db = client.db()
  const users = db.collection('users')

  const existing = await users.findOne({ email: parsed.data.email })
  // Hash on both paths so the expensive work does not reveal account existence.
  const hashedPassword = await bcrypt.hash(parsed.data.password, 12)
  if (!existing) await users.insertOne({
    name: parsed.data.name,
    email: parsed.data.email,
    password: hashedPassword,
    emailVerified: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return apiSuccess({ message: 'Registration request processed. You can now try signing in.' }, 201)
}
