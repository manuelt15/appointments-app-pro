import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // All /api/ routes handle their own auth (session or API key)
  if (pathname.startsWith('/api/')) return NextResponse.next()

  const publicPaths = ['/login', '/register']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
