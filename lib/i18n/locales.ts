export const LOCALES = ['es', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'es'

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value)
}
