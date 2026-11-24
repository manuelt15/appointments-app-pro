import { describe, expect, it } from 'vitest'
import { PRIVACY_CONSENT_MAX_AGE } from '@/lib/legal/privacy'
import { DELETE, POST } from './route'

describe('POST /api/privacy-consent', () => {
  it('guarda el consentimiento en una cookie HttpOnly de corta vida', async () => {
    const response = await POST()

    expect(response.status).toBe(200)
    const setCookie = response.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('privacy_consent=1')
    expect(setCookie).toContain(`Max-Age=${PRIVACY_CONSENT_MAX_AGE}`)
    expect(setCookie).toContain('Path=/')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie.toLowerCase()).toContain('samesite=lax')
  })

  it('la cookie caduca en diez minutos', () => {
    expect(PRIVACY_CONSENT_MAX_AGE).toBe(600)
  })
})

describe('DELETE /api/privacy-consent', () => {
  it('borra la cookie cuando se desmarca la casilla', async () => {
    const response = await DELETE()

    expect(response.status).toBe(200)
    const setCookie = response.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('privacy_consent=')
    expect(setCookie).toContain('Max-Age=0')
  })
})
