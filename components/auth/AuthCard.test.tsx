import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderInLocale } from '@/lib/i18n/test-locale'
import { OAuthButtons } from './AuthCard'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))

function oauthButton(html: string, label: string) {
  const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? []
  return buttons.find((button) => button.includes(label))
}

function renderButtons(disabled: boolean, locale: 'es' | 'en' = 'en') {
  return renderInLocale(
    locale,
    createElement(OAuthButtons, { callbackUrl: '/business/new', disabled, descriptionId: 'oauth-consent-hint' }),
  )
}

describe('OAuthButtons', () => {
  it('deshabilita Google y GitHub y explica por que cuando falta el consentimiento', () => {
    const html = renderButtons(true)

    for (const label of ['Continue with Google', 'Continue with GitHub']) {
      const button = oauthButton(html, label)
      expect(button, label).toBeDefined()
      expect(button).toMatch(/\sdisabled(=""|\s|>)/)
      expect(button).toContain('aria-describedby="oauth-consent-hint"')
    }
  })

  it('habilita los botones y retira la explicacion cuando hay consentimiento', () => {
    const html = renderButtons(false)

    for (const label of ['Continue with Google', 'Continue with GitHub']) {
      const button = oauthButton(html, label)
      expect(button, label).toBeDefined()
      expect(button).not.toMatch(/\sdisabled(=""|\s|>)/)
      expect(button).not.toContain('aria-describedby')
    }
  })

  it('traduce las etiquetas sin tocar el nombre del proveedor', () => {
    const html = renderButtons(false, 'es')

    for (const label of ['Continuar con Google', 'Continuar con GitHub']) {
      expect(oauthButton(html, label), label).toBeDefined()
    }
    expect(html).not.toContain('Continue with')
  })
})
