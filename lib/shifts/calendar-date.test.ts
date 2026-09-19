import { describe, expect, it } from 'vitest'
import { isBirthday, isCalendarDate, parseCalendarDate } from './calendar-date'

describe('calendar dates', () => {
  it('accepts a well formed date', () => {
    expect(isCalendarDate('1990-03-14')).toBe(true)
  })

  it('rejects malformed or impossible dates', () => {
    expect(isCalendarDate('1990-3-14')).toBe(false)
    expect(isCalendarDate('not-a-date')).toBe(false)
    expect(isCalendarDate('1990-02-31')).toBe(false)
    expect(isCalendarDate('1990-13-01')).toBe(false)
  })

  it('parses to the same day it names, with no timezone drift', () => {
    const parsed = parseCalendarDate('1990-03-14')

    expect(parsed?.getFullYear()).toBe(1990)
    expect(parsed?.getMonth()).toBe(2)
    expect(parsed?.getDate()).toBe(14)
  })
})

describe('birthday matching', () => {
  it('matches day and month regardless of year', () => {
    expect(isBirthday('1990-03-14', new Date(2026, 2, 14))).toBe(true)
    expect(isBirthday('1990-03-14', new Date(2030, 2, 14))).toBe(true)
  })

  it('does not match a different day', () => {
    expect(isBirthday('1990-03-14', new Date(2026, 2, 15))).toBe(false)
    expect(isBirthday('1990-03-14', new Date(2026, 3, 14))).toBe(false)
  })

  it('handles a missing or invalid birthday', () => {
    expect(isBirthday(undefined, new Date())).toBe(false)
    expect(isBirthday('', new Date())).toBe(false)
    expect(isBirthday('nonsense', new Date())).toBe(false)
  })

  it('matches 29 February only on a leap day', () => {
    expect(isBirthday('2000-02-29', new Date(2028, 1, 29))).toBe(true)
    expect(isBirthday('2000-02-29', new Date(2026, 1, 28))).toBe(false)
  })
})
