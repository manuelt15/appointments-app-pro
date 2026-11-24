import { t as translate, type TranslationParams } from '@/lib/i18n/translate'
import type { Locale } from '@/lib/i18n/locales'

const DAY_MS = 24 * 60 * 60 * 1000

/** Whole days left until the key expires. Negative when it already expired. */
export function daysUntil(iso: string, now: number = Date.now()): number {
  return Math.ceil((new Date(iso).getTime() - now) / DAY_MS)
}

/**
 * Expiry label for the key list. A key that already expired is labelled
 * "Expired" instead of a countdown, so it is visible without opening anything.
 *
 * The label is translated here, next to the number that chooses between the
 * singular and the plural. `now` stays last, with a default, so a component
 * never has to call `Date.now()` while rendering.
 */
export function expiryLabel(
  iso: string | undefined,
  locale: Locale = 'es',
  now: number = Date.now(),
): { label: string; expired: boolean } {
  const t = (key: string, params?: TranslationParams) => translate(locale, key, params)
  if (!iso) return { label: t('settings.keys.noExpiry'), expired: false }
  const days = daysUntil(iso, now)
  if (days <= 0) return { label: t('settings.keys.expired'), expired: true }
  return {
    label: days === 1 ? t('settings.keys.expiresInOne') : t('settings.keys.expiresIn', { days }),
    expired: false,
  }
}

/** Usage label: "Never used" or "Last used 2 days ago". */
export function lastUsedLabel(iso: string | undefined, locale: Locale = 'es', now: number = Date.now()): string {
  const t = (key: string, params?: TranslationParams) => translate(locale, key, params)
  if (!iso) return t('settings.keys.neverUsed')
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS)
  if (days <= 0) return t('settings.keys.lastUsedToday')
  return days === 1 ? t('settings.keys.lastUsedOne') : t('settings.keys.lastUsed', { days })
}
