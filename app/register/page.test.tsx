import { createElement } from 'react'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
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

describe('RegisterPage', () => {
  it('arranca con Google y GitHub deshabilitados hasta aceptar el aviso', () => {
    const html = renderToStaticMarkup(createElement(RegisterPage))

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
    const html = renderToStaticMarkup(createElement(RegisterPage))

    expect(html).toContain('id="consent"')
    expect(html).toContain('I have read and accept the')
  })
})
