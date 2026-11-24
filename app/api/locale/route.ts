import { NextResponse } from 'next/server'
import { isLocale } from '@/lib/i18n/locales'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
  }
  const locale = body !== null && typeof body === 'object' && 'locale' in body ? body.locale : undefined
  if (!isLocale(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
  }
  const response = NextResponse.json({ locale })
  response.cookies.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}
