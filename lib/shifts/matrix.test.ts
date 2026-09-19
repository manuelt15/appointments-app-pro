import { describe, expect, it } from 'vitest'
import { clampToDay, hoursInRange, overlapsDay } from './matrix'

const monday = new Date(2026, 8, 14)
const tuesday = new Date(2026, 8, 15)
const sunday = new Date(2026, 8, 20)
const nextMonday = new Date(2026, 8, 21)

// The vacation that exposed the bug: 14 Sep 09:00 to 20 Sep 17:00.
const vacation = {
  start: new Date(2026, 8, 14, 9, 0),
  end: new Date(2026, 8, 20, 17, 0),
}

const morningShift = {
  start: new Date(2026, 8, 14, 9, 0),
  end: new Date(2026, 8, 14, 17, 0),
}

describe('shifts spanning several days', () => {
  it('covers every day between its start and end', () => {
    expect(overlapsDay(vacation, monday)).toBe(true)
    expect(overlapsDay(vacation, tuesday)).toBe(true)
    expect(overlapsDay(vacation, sunday)).toBe(true)
  })

  it('does not leak into days outside the range', () => {
    expect(overlapsDay(vacation, nextMonday)).toBe(false)
    expect(overlapsDay(vacation, new Date(2026, 8, 13))).toBe(false)
  })

  it('keeps a single-day shift on its own day', () => {
    expect(overlapsDay(morningShift, monday)).toBe(true)
    expect(overlapsDay(morningShift, tuesday)).toBe(false)
  })

  it('treats a shift ending exactly at midnight as not reaching the next day', () => {
    const untilMidnight = { start: new Date(2026, 8, 14, 22, 0), end: new Date(2026, 8, 15, 0, 0) }

    expect(overlapsDay(untilMidnight, monday)).toBe(true)
    expect(overlapsDay(untilMidnight, tuesday)).toBe(false)
  })

  it('marks a night shift crossing midnight on both days', () => {
    const nightShift = { start: new Date(2026, 8, 14, 22, 0), end: new Date(2026, 8, 15, 6, 0) }

    expect(overlapsDay(nightShift, monday)).toBe(true)
    expect(overlapsDay(nightShift, tuesday)).toBe(true)
  })
})

describe('clamping a shift to the day being drawn', () => {
  it('leaves a shift contained in the day untouched', () => {
    const clamped = clampToDay(morningShift, monday)

    expect(clamped.start).toEqual(morningShift.start)
    expect(clamped.end).toEqual(morningShift.end)
    expect(clamped.continuesBefore).toBe(false)
    expect(clamped.continuesAfter).toBe(false)
  })

  it('trims the middle day of a range to that day', () => {
    const clamped = clampToDay(vacation, tuesday)

    expect(clamped.start).toEqual(new Date(2026, 8, 15, 0, 0, 0, 0))
    expect(clamped.continuesBefore).toBe(true)
    expect(clamped.continuesAfter).toBe(true)
  })

  it('flags only the tail on the closing day', () => {
    const clamped = clampToDay(vacation, sunday)

    expect(clamped.end).toEqual(vacation.end)
    expect(clamped.continuesBefore).toBe(true)
    expect(clamped.continuesAfter).toBe(false)
  })
})

describe('weekly hours', () => {
  const weekStart = new Date(2026, 8, 14)
  const weekEnd = new Date(2026, 8, 21)

  it('is zero with no shifts', () => {
    expect(hoursInRange([], weekStart, weekEnd)).toBe(0)
  })

  it('adds up shifts inside the week', () => {
    const hours = hoursInRange([
      { start: new Date(2026, 8, 14, 9), end: new Date(2026, 8, 14, 17) },
      { start: new Date(2026, 8, 15, 9), end: new Date(2026, 8, 15, 17) },
    ], weekStart, weekEnd)

    expect(hours).toBe(16)
  })

  it('counts only the part falling inside the week', () => {
    const hours = hoursInRange([
      { start: new Date(2026, 8, 13, 20), end: new Date(2026, 8, 14, 4) },
    ], weekStart, weekEnd)

    expect(hours).toBe(4)
  })

  it('ignores a shift entirely outside the week', () => {
    const hours = hoursInRange([
      { start: new Date(2026, 8, 22, 9), end: new Date(2026, 8, 22, 17) },
    ], weekStart, weekEnd)

    expect(hours).toBe(0)
  })

  it('keeps one decimal for part hours', () => {
    const hours = hoursInRange([
      { start: new Date(2026, 8, 14, 9), end: new Date(2026, 8, 14, 16, 20) },
    ], weekStart, weekEnd)

    expect(hours).toBe(7.3)
  })
})
