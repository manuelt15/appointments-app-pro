import { createElement } from 'react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderInLocale } from '@/lib/i18n/test-locale'
import LoginPage from './page'

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
function renderLogin() {
  return renderInLocale('en', createElement(LoginPage))
}

describe('LoginPage', () => {
  it('arranca con Google y GitHub deshabilitados hasta aceptar el aviso', () => {
    const html = renderLogin()

    for (const label of ['Continue with Google', 'Continue with GitHub']) {
      const button = oauthButton(html, label)
      expect(button, label).toBeDefined()
      expect(button).toMatch(/\sdisabled(=""|\s|>)/)
      expect(button).toContain('aria-describedby="oauth-consent-hint"')
    }

    expect(html).toContain('id="consent"')
    expect(html).toContain('id="oauth-consent-hint"')
    expect(html).toContain('Accept the privacy notice above to continue with Google or GitHub.')
  })

  it('no exige la casilla para entrar con correo y contrasena', () => {
    const html = renderLogin()

    const signInButton = html.match(/<button\b[^>]*>\s*Sign in\s*<\/button>/)?.[0]
    expect(signInButton).toBeDefined()
    expect(signInButton).not.toMatch(/\sdisabled(=""|\s|>)/)
  })

  it('en espanol no deja restos de texto en ingles', () => {
    const html = renderInLocale('es', createElement(LoginPage))

    expect(html).toContain('Entrar')
    expect(html).toContain('Acepta el aviso de privacidad de arriba para continuar con Google o GitHub.')
    expect(html).not.toContain('Continue with Google')
    expect(html).not.toContain('Sign in')
  })
})
