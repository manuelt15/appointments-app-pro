import { createElement } from 'react'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { AcceptPrivacyForm } from './AcceptPrivacyForm'

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

vi.mock('next/link', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}))

function oauthButton(html: string, label: string) {
  const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? []
  return buttons.find((button) => button.includes(label))
}

describe('AcceptPrivacyForm', () => {
  it('no deja terminar el alta hasta aceptar el aviso', () => {
    const html = renderToStaticMarkup(createElement(AcceptPrivacyForm))

    for (const label of ['Continue with Google', 'Continue with GitHub']) {
      const button = oauthButton(html, label)
      expect(button, label).toBeDefined()
      expect(button).toMatch(/\sdisabled(=""|\s|>)/)
      expect(button).toContain('aria-describedby="accept-consent-hint"')
    }

    expect(html).toContain('id="consent"')
    expect(html).toContain('Accept the privacy notice to create your account.')
  })
})
