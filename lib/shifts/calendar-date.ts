import { isValid, parse } from 'date-fns'

/**
 * Birthdays and start dates are calendar dates, not instants: storing them as
 * Date would let a timezone shift them a day. They travel as plain YYYY-MM-DD.
 */
export const CALENDAR_DATE_FORMAT = 'yyyy-MM-dd'
const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isCalendarDate(value: string) {
  if (!CALENDAR_DATE_PATTERN.test(value)) return false
  return isValid(parse(value, CALENDAR_DATE_FORMAT, new Date()))
}

export function parseCalendarDate(value: string) {
  if (!isCalendarDate(value)) return null
  return parse(value, CALENDAR_DATE_FORMAT, new Date())
}

/** Same day and month, any year. */
export function isBirthday(birthday: string | undefined, day: Date) {
  const parsed = birthday ? parseCalendarDate(birthday) : null
  if (!parsed) return false
  return parsed.getMonth() === day.getMonth() && parsed.getDate() === day.getDate()
}
