import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Credentials from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { clientPromise } from '@/lib/mongodb/client'
import { authorizeWithPassword } from '@/lib/auth/credentials'
import { createUserEvent, enforcePrivacyAtSignUp } from '@/lib/legal/oauth-consent'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    ...authConfig.callbacks,
    // Blocks the sign-up of a new OAuth account until the notice is accepted,
    // without touching existing accounts. Needs the database, so it cannot live
    // in auth.config.ts, which the edge proxy also loads.
    signIn: enforcePrivacyAtSignUp,
  },
  events: {
    // OAuth creates the account outside the register form; record the consent
    // the browser carried through the short-lived cookie.
    createUser: createUserEvent,
  },
  providers: [
    Google,
    GitHub,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        return authorizeWithPassword(credentials)
      },
    }),
  ],
})
