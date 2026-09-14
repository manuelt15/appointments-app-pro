import moment from 'moment-timezone'

const DATE_FORMAT = 'YYYY-MM-DD'
const DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm'
const DATETIME_WITH_SECONDS_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSS'

export function isValidTimeZone(timeZone: string) {
  return moment.tz.zone(timeZone) !== null
}

export function getBusinessDayBounds(date: string, timeZone: string) {
  if (!isValidTimeZone(timeZone)) throw new Error('Invalid timezone')

  const start = moment.tz(date, DATE_FORMAT, true, timeZone)
  if (!start.isValid() || start.format(DATE_FORMAT) !== date) throw new Error('Invalid date')

  return {
    start: start.toDate(),
    end: start.clone().add(1, 'day').toDate(),
  }
}

export function toBusinessDateTimeLocal(date: string | Date, timeZone: string) {
  if (!isValidTimeZone(timeZone)) throw new Error('Invalid timezone')
  return moment(date).tz(timeZone).format(DATETIME_FORMAT)
}

export function calendarDateToLocalInput(date?: Date) {
  const value = date ?? new Date(Date.now() + 30 * 60 * 1000)
  return moment(value).format(DATETIME_FORMAT)
}

export function businessDateTimeLocalToIso(value: string, timeZone: string) {
  return parseUnambiguousLocalDateTime(value, DATETIME_FORMAT, timeZone).toISOString()
}

export function toCalendarDate(date: string | Date, timeZone: string) {
  if (!isValidTimeZone(timeZone)) throw new Error('Invalid timezone')

  const zoned = moment(date).tz(timeZone)
  return new Date(
    zoned.year(),
    zoned.month(),
    zoned.date(),
    zoned.hour(),
    zoned.minute(),
    zoned.second(),
    zoned.millisecond()
  )
}

export function calendarDateToIso(date: Date, timeZone: string) {
  const localValue = moment(date).format(DATETIME_WITH_SECONDS_FORMAT)
  return parseUnambiguousLocalDateTime(localValue, DATETIME_WITH_SECONDS_FORMAT, timeZone).toISOString()
}

function parseUnambiguousLocalDateTime(value: string, format: string, timeZone: string) {
  const zone = moment.tz.zone(timeZone)
  if (!zone) throw new Error('Invalid timezone')

  const wallTime = moment.utc(value, format, true)
  if (!wallTime.isValid() || wallTime.format(format) !== value) {
    throw new Error('Invalid local date and time')
  }

  const candidates = [...new Set(zone.offsets)]
    .map((offset) => wallTime.valueOf() + offset * 60_000)
    .filter((timestamp) => moment(timestamp).tz(timeZone).format(format) === value)

  if (candidates.length === 0) throw new Error('Invalid local date and time')
  if (candidates.length > 1) throw new Error('Ambiguous local date and time')
  return moment(candidates[0])
}

export function getCalendarLoadRange(date: Date, timeZone: string) {
  if (!isValidTimeZone(timeZone)) throw new Error('Invalid timezone')

  const localDate = moment(date).format(DATE_FORMAT)
  const month = moment.tz(localDate, DATE_FORMAT, true, timeZone)

  return {
    start: month.clone().startOf('month').subtract(1, 'week').toISOString(),
    end: month.clone().endOf('month').add(1, 'week').add(1, 'millisecond').toISOString(),
  }
}
