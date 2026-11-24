import { NextResponse } from 'next/server'
import { PRIVACY_CONSENT_COOKIE, PRIVACY_CONSENT_MAX_AGE } from '@/lib/legal/privacy'

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
}

export async function POST() {
  const response = NextResponse.json({ success: true, data: { ok: true } })
  response.cookies.set({
    name: PRIVACY_CONSENT_COOKIE,
    value: '1',
    maxAge: PRIVACY_CONSENT_MAX_AGE,
    ...cookieOptions,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, data: { ok: true } })
  response.cookies.set({
    name: PRIVACY_CONSENT_COOKIE,
    value: '',
    maxAge: 0,
    ...cookieOptions,
  })
  return response
}
