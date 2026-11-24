import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider, useLocale } from './client'
import type { Locale } from './locales'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })

function renderLocale(locale: Locale) {
  let context: ReturnType<typeof useLocale> | undefined
  function Consumer() {
    context = useLocale()
    return createElement('span', null, context.t('nav.home'))
  }
  const html = renderToStaticMarkup(<LocaleProvider locale={locale}><Consumer /></LocaleProvider>)
  return { html, context: context! }
}

describe('LocaleProvider', () => {
  it('exposes the initial locale and translations, including fresh server props', () => {
    expect(renderLocale('es').html).toContain('Inicio')
    const { html, context } = renderLocale('en')
    expect(html).toContain('Home')
    expect(context.locale).toBe('en')
  })
  it('posts the selected locale before refreshing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await renderLocale('es').context.setLocale('en')
    expect(fetchMock).toHaveBeenCalledWith('/api/locale', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: 'en' }),
    })
    expect(refresh).toHaveBeenCalledOnce()
    expect(fetchMock.mock.invocationCallOrder[0]).toBeLessThan(refresh.mock.invocationCallOrder[0])
  })
  it('does not refresh when persistence fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(renderLocale('es').context.setLocale('en')).rejects.toThrow('Unable to change locale')
    expect(refresh).not.toHaveBeenCalled()
  })
  it('requires a provider', () => {
    function Consumer() { useLocale(); return null }
    expect(() => renderToStaticMarkup(createElement(Consumer))).toThrow('useLocale must be used within LocaleProvider')
  })
})
