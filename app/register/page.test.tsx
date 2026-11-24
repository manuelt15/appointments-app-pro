import { createElement } from 'react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderInLocale } from '@/lib/i18n/test-locale'
import RegisterPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

vi.mock('next/link', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}))

function oauthButton(html: string, label: string) {
  const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? []
  return buttons.find((button) => button.includes(label))
}

// The app opens in Spanish; this screen has always been written in English, so
// the assertions pin the English locale instead of the default one.
function renderRegister() {
  return renderInLocale('en', createElement(RegisterPage))
}

describe('RegisterPage', () => {
  it('arranca con Google y GitHub deshabilitados hasta aceptar el aviso', () => {
    const html = renderRegister()

    for (const label of ['Continue with Google', 'Continue with GitHub']) {
      const button = oauthButton(html, label)
      expect(button, label).toBeDefined()
      expect(button).toMatch(/\sdisabled(=""|\s|>)/)
      expect(button).toContain('aria-describedby="oauth-consent-hint"')
    }

    expect(html).toContain('id="oauth-consent-hint"')
    expect(html).toContain('Accept the privacy notice below to continue with Google or GitHub.')
  })

  it('mantiene la casilla de consentimiento que exige el registro por credenciales', () => {
    const html = renderRegister()

    expect(html).toContain('id="consent"')
    expect(html).toContain('I have read and accept the')
  })

  it('en espanol la casilla de consentimiento y el aviso estan traducidos', () => {
    const html = renderInLocale('es', createElement(RegisterPage))

    expect(html).toContain('He leído y acepto el')
    expect(html).toContain('aviso de privacidad')
    expect(html).toContain('Acepta el aviso de privacidad de abajo para continuar con Google o GitHub.')
    expect(html).not.toContain('I have read and accept the')
  })
})
