import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LocaleProvider } from './client'
import type { Locale } from './locales'

/**
 * Renders a component the way the app mounts it, inside the locale provider,
 * so a test can pin the language instead of depending on the default one.
 *
 * Mock `next/navigation` (`useRouter`) in the test file: the provider reads the
 * router to refresh the page when the language changes.
 */
export function renderInLocale(locale: Locale, node: ReactElement): string {
  return renderToStaticMarkup(<LocaleProvider locale={locale}>{node}</LocaleProvider>)
}
