import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, isLocale, type Locale } from './locales'

export { t } from './translate'
export type { TranslationKey, TranslationParams } from './translate'

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get('locale')?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}
