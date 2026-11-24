import { describe, expect, it } from 'vitest'
import { POST } from './route'

function request(body: unknown) {
  return new Request('http://localhost/api/locale', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

describe('POST /api/locale', () => {
  it.each([{ locale: 'fr' }, {}, null, { locale: 42 }, { locale: ['en'] }])('rejects invalid locale %j without a cookie', async (body) => {
    const response = await POST(request(body))
    expect(response.status).toBe(400)
    expect(response.headers.get('set-cookie')).toBeNull()
  })
  it('rejects malformed JSON without a cookie', async () => {
    const response = await POST(new Request('http://localhost/api/locale', { method: 'POST', body: '{' }))
    expect(response.status).toBe(400)
    expect(response.headers.get('set-cookie')).toBeNull()
  })
  it.each(['en', 'es'])('persists %s with the required cookie attributes', async (locale) => {
    const response = await POST(request({ locale }))
    expect(response.status).toBe(200)
    const cookie = response.headers.get('set-cookie')!
    expect(cookie).toContain(`locale=${locale}`)
    expect(cookie).toContain('Path=/')
    expect(cookie).toContain('Max-Age=31536000')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=lax')
  })
})
