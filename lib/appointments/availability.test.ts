import { describe, expect, it } from 'vitest'
import { AvailabilityQuerySchema, buildCalendarLookup } from './availability'

const interval = {
  start_time: '2026-09-12T09:00:00+02:00',
  end_time: '2026-09-12T10:00:00+02:00',
}

const calendarId = '507f1f77bcf86cd799439011'
const employeeId = '507f1f77bcf86cd799439012'

describe('availability query', () => {
  it('accepts ISO timestamps with an offset', () => {
    expect(AvailabilityQuerySchema.safeParse({ ...interval, calendar_id: calendarId }).success).toBe(true)
  })

  it('requires exactly one resource selector', () => {
    expect(AvailabilityQuerySchema.safeParse(interval).success).toBe(false)
    expect(AvailabilityQuerySchema.safeParse({
      ...interval,
      calendar_id: calendarId,
      employee_id: employeeId,
    }).success).toBe(false)
  })

  it('rejects reversed intervals', () => {
    expect(AvailabilityQuerySchema.safeParse({
      calendar_id: calendarId,
      start_time: interval.end_time,
      end_time: interval.start_time,
    }).success).toBe(false)
  })

  it('builds a business-scoped active calendar lookup', () => {
    const query = AvailabilityQuerySchema.parse({ ...interval, employee_id: employeeId })

    expect(buildCalendarLookup(query, 'business-1')).toEqual({
      businessId: 'business-1',
      isActive: true,
      employeeId,
    })
  })
})
