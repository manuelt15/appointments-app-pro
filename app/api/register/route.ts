import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { apiSuccess, apiError } from '@/lib/api/response'
import { clientPromise } from '@/lib/mongodb/client'
import { isDuplicateKeyError } from '@/lib/mongodb/indexes'

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
  const hashedPassword = await bcrypt.hash(parsed.data.password, 12)

  // Same status and body whether the email is taken or not: answering 409
  // "already registered" let anyone enumerate which addresses have an account.
  // Hashing even when the account exists keeps the response time similar.
  // The real flow needs an email provider (there is none yet) to send a
  // confirmation link, so this endpoint cannot tell a user their account
  // already exists; they find out when signing in.
  if (!existing) {
    try {
      await users.insertOne({
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } catch (error) {
      // The unique index on users.email settles this race: two concurrent POSTs
      // both pass the findOne above and only one wins the insert. The loser must
      // land on the same 201 as everyone else, or the status would be a way to
      // ask whether an address has an account. Any other error is a real failure.
      if (!isDuplicateKeyError(error)) throw error
    }
  }

  return apiSuccess({ ok: true }, 201)
}
