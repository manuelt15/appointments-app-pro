import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { LanguageControl } from './LanguageControl'
import { LocaleProvider } from '@/lib/i18n/client'
import type { Locale } from '@/lib/i18n/locales'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

function render(locale: Locale, expanded: boolean) {
  return renderToStaticMarkup(
    <LocaleProvider locale={locale}>
      <LanguageControl expanded={expanded} />
    </LocaleProvider>
  )
}

describe('LanguageControl', () => {
  it('expanded shows ES and EN in one box, with no visible label beside it', () => {
    const html = render('es', true)
    expect(html).toContain('role="group"')
    expect(html).toContain('aria-label="Idioma"')
    expect(html).toContain('aria-label="Español"')
    expect(html).toContain('aria-label="Inglés"')
    expect(html).toMatch(/aria-pressed="true"[^>]*><span[^>]*>es<\/span>/)
    expect(html).toMatch(/aria-pressed="false"[^>]*><span[^>]*>en<\/span>/)
    // The group label exists for screen readers only.
    expect(html).not.toContain('>Idioma<')
  })

  it('expanded follows the active locale', () => {
    const html = render('en', true)
    expect(html).toMatch(/aria-pressed="true"[^>]*><span[^>]*>en<\/span>/)
    expect(html).toMatch(/aria-pressed="false"[^>]*><span[^>]*>es<\/span>/)
  })

  it('collapsed shows a single accessible trigger with the active code', () => {
    const html = render('en', false)
    expect(html).toContain('aria-label="English"')
    expect(html).toContain('>en</span>')
    expect(html.match(/<button/g)).toHaveLength(1)
  })
})
