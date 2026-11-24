import { format, type Locale as DateFnsLocale } from 'date-fns'
import { enGB, es } from 'date-fns/locale'
import moment from 'moment-timezone'
import type { Locale } from './locales'

/**
 * Month and weekday names come from date-fns locales, never from a list typed by
 * hand: the same pattern used with `format` keeps the existing layout ("2 Nov")
 * and only the words follow the UI language ("2 nov").
 */
const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { es, en: enGB }

export function dateFnsLocale(locale: Locale): DateFnsLocale {
  return DATE_FNS_LOCALES[locale]
}

/** Formats a Date the browser or server already holds in its own clock. */
export function formatDate(value: Date, pattern: string, locale: Locale) {
  return format(value, pattern, { locale: dateFnsLocale(locale) })
}

/**
 * A Date whose local fields are the wall clock of `value` in `timeZone`. The
 * instant is not what gets painted: the schedule shows the business's clock, so
 * formatting has to read those fields, not the machine's.
 */
export function wallClock(value: Date, timeZone: string): Date {
  const zone = moment(value).tz(timeZone)
  return new Date(zone.year(), zone.month(), zone.date(), zone.hours(), zone.minutes(), zone.seconds())
}

/** Formats an instant as the business clock of `timeZone`, with localised names. */
export function formatInZone(value: Date, timeZone: string, pattern: string, locale: Locale) {
  return formatDate(wallClock(value, timeZone), pattern, locale)
}
