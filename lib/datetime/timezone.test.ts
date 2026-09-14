import { describe, expect, it } from 'vitest'
import {
  businessDateTimeLocalToIso,
  getBusinessDayBounds,
  isValidTimeZone,
  toBusinessDateTimeLocal,
  toCalendarDate,
} from './timezone'

describe('business timezone helpers', () => {
  it('validates IANA timezone names', () => {
    expect(isValidTimeZone('Europe/Madrid')).toBe(true)
    expect(isValidTimeZone('Mars/Olympus')).toBe(false)
  })

  it('creates a 23-hour day across the spring DST transition', () => {
    const { start, end } = getBusinessDayBounds('2026-03-29', 'Europe/Madrid')
    expect(end.getTime() - start.getTime()).toBe(23 * 60 * 60 * 1000)
  })

  it('creates a 25-hour day across the autumn DST transition', () => {
    const { start, end } = getBusinessDayBounds('2026-10-25', 'Europe/Madrid')
    expect(end.getTime() - start.getTime()).toBe(25 * 60 * 60 * 1000)
  })

  it('round-trips an instant through the business local time', () => {
    const instant = '2026-09-12T07:30:00.000Z'
    const local = toBusinessDateTimeLocal(instant, 'Europe/Madrid')

    expect(local).toBe('2026-09-12T09:30')
    expect(businessDateTimeLocalToIso(local, 'Europe/Madrid')).toBe(instant)
  })

  it('projects the current instant onto the business calendar day', () => {
    const calendarDate = toCalendarDate('2026-05-01T00:30:00.000Z', 'Europe/Madrid')

    expect(calendarDate.getDate()).toBe(1)
    expect(calendarDate.getHours()).toBe(2)
  })

  it('rejects a local time skipped by DST', () => {
    expect(() => businessDateTimeLocalToIso('2026-03-29T02:30', 'Europe/Madrid')).toThrow(
      'Invalid local date and time'
    )
  })

  it('rejects a local time repeated by DST instead of choosing silently', () => {
    expect(() => businessDateTimeLocalToIso('2026-10-25T02:30', 'Europe/Madrid')).toThrow(
      'Ambiguous local date and time'
    )
  })

  it('detects ambiguity in zones with a 30-minute DST transition', () => {
    expect(() => businessDateTimeLocalToIso('2026-04-05T01:45', 'Australia/Lord_Howe')).toThrow(
      'Ambiguous local date and time'
    )
  })
})
