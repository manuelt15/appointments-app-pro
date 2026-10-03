import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      /** google, github or credentials. Missing on sessions started before it was recorded. */
      provider?: string
    }
  }
}
