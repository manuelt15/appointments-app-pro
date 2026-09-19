import { endOfDay, startOfDay } from 'date-fns'

interface DayRange {
  start: Date
  end: Date
}

/**
 * A shift belongs to every day it touches, not only the one it starts in,
 * so a week of vacation shows up across the whole row.
 */
export function overlapsDay(range: DayRange, day: Date) {
  return range.start < endOfDay(day) && range.end > startOfDay(day)
}

/** The part of the shift that falls inside this day, for display. */
export function clampToDay(range: DayRange, day: Date) {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)

  return {
    start: range.start < dayStart ? dayStart : range.start,
    end: range.end > dayEnd ? dayEnd : range.end,
    continuesBefore: range.start < dayStart,
    continuesAfter: range.end > dayEnd,
  }
}

/**
 * Hours an employee is scheduled inside a window, counting only working shifts
 * and only the part that falls inside it, so a shift straddling the week edge
 * does not inflate the total.
 */
export function hoursInRange(ranges: DayRange[], windowStart: Date, windowEnd: Date) {
  const total = ranges.reduce((sum, range) => {
    const start = range.start < windowStart ? windowStart : range.start
    const end = range.end > windowEnd ? windowEnd : range.end
    if (end <= start) return sum
    return sum + (end.getTime() - start.getTime()) / 3_600_000
  }, 0)

  return Math.round(total * 10) / 10
}
