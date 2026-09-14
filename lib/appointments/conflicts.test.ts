import { describe, expect, it } from 'vitest'
import { buildConflictFilter } from './conflicts'

describe('appointment conflict filters', () => {
  it('scopes conflicts to the business and calendar', () => {
    const filter = buildConflictFilter({
      businessId: 'business-1',
      calendarId: 'calendar-1',
      startTime: '2026-09-12T09:00:00.000Z',
      endTime: '2026-09-12T10:00:00.000Z',
    })

    expect(filter).toMatchObject({
      businessId: 'business-1',
      calendarId: 'calendar-1',
      status: { $ne: 'cancelled' },
    })
  })

  it('detects any interval that crosses the requested range', () => {
    const filter = buildConflictFilter({
      businessId: 'business-1',
      calendarId: 'calendar-1',
      startTime: '2026-09-12T09:00:00.000Z',
      endTime: '2026-09-12T10:00:00.000Z',
    })

    expect(filter.startTime.$lt).toEqual(new Date('2026-09-12T10:00:00.000Z'))
    expect(filter.endTime.$gt).toEqual(new Date('2026-09-12T09:00:00.000Z'))
  })

  it('excludes the appointment being moved or resized', () => {
    const filter = buildConflictFilter({
      businessId: 'business-1',
      calendarId: 'calendar-1',
      startTime: '2026-09-12T09:00:00.000Z',
      endTime: '2026-09-12T10:00:00.000Z',
      excludeAppointmentId: 'appointment-1',
    })

    expect(filter).toMatchObject({ _id: { $ne: 'appointment-1' } })
  })
})
