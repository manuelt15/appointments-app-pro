import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Credentials from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { clientPromise, connectDB } from '@/lib/mongodb/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Google,
    GitHub,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z.object({
          email: z.email(),
          password: z.string().min(8),
        }).safeParse(credentials)

        if (!parsed.success) return null

        await connectDB()
        const client = await clientPromise
        const db = client.db()
        const user = await db.collection('users').findOne({ email: parsed.data.email })

        if (!user?.password) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return { id: user._id.toString(), email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
})
