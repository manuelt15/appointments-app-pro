import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user, account }) {
      if (user) token.id = user.id
      // Only present at sign-in; kept in the token so the UI can say how the user signed in.
      if (account) token.provider = account.provider
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      if (token.provider) session.user.provider = token.provider as string
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
} satisfies NextAuthConfig
