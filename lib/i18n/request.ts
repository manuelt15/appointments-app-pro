import { DEFAULT_LOCALE, isLocale, type Locale } from './locales'

/**
 * Locale of an API call, read from the same `locale` cookie the UI writes.
 *
 * Route handlers answer with text a toast paints on screen, so they have to
 * answer in the language the person is using. `getLocale()` belongs to server
 * components; a route already has the request in hand.
 */
export function requestLocale(request: { cookies: { get(name: string): { value: string } | undefined } }): Locale {
  const value = request.cookies.get('locale')?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}
