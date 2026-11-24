import { createElement } from 'react'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
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

describe('LoginPage', () => {
  it('arranca con Google y GitHub deshabilitados hasta aceptar el aviso', () => {
    const html = renderToStaticMarkup(createElement(LoginPage))

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
    const html = renderToStaticMarkup(createElement(LoginPage))

    const signInButton = html.match(/<button\b[^>]*>\s*Sign in\s*<\/button>/)?.[0]
    expect(signInButton).toBeDefined()
    expect(signInButton).not.toMatch(/\sdisabled(=""|\s|>)/)
  })
})
