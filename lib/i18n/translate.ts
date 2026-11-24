import { es } from './dictionaries/es'
import { en } from './dictionaries/en'
import type { Locale } from './locales'

export type TranslationKey = keyof typeof es
export type TranslationParams = Record<string, string | number>
const dictionaries = { es, en }

export function t(locale: Locale, key: string, params: TranslationParams = {}): string {
  const dictionary = dictionaries[locale]
  // Missing keys remain visible: return the key, never an invented translation.
  if (!Object.hasOwn(dictionary, key)) return key
  return dictionary[key as TranslationKey].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : placeholder
  )
}
