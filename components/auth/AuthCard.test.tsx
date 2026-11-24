import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { OAuthButtons } from './AuthCard'

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))

function oauthButton(html: string, label: string) {
  const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? []
  return buttons.find((button) => button.includes(label))
}

describe('OAuthButtons', () => {
  it('deshabilita Google y GitHub y explica por que cuando falta el consentimiento', () => {
    const html = renderToStaticMarkup(
      createElement(OAuthButtons, { callbackUrl: '/business/new', disabled: true, descriptionId: 'oauth-consent-hint' }),
    )

    for (const label of ['Continue with Google', 'Continue with GitHub']) {
      const button = oauthButton(html, label)
      expect(button, label).toBeDefined()
      expect(button).toMatch(/\sdisabled(=""|\s|>)/)
      expect(button).toContain('aria-describedby="oauth-consent-hint"')
    }
  })

  it('habilita los botones y retira la explicacion cuando hay consentimiento', () => {
    const html = renderToStaticMarkup(
      createElement(OAuthButtons, { callbackUrl: '/business/new', disabled: false, descriptionId: 'oauth-consent-hint' }),
    )

    for (const label of ['Continue with Google', 'Continue with GitHub']) {
      const button = oauthButton(html, label)
      expect(button, label).toBeDefined()
      expect(button).not.toMatch(/\sdisabled(=""|\s|>)/)
      expect(button).not.toContain('aria-describedby')
    }
  })
})
