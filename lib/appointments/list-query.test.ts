import { describe, expect, it } from 'vitest'
import {
  AppointmentListQuerySchema,
  buildAppointmentListFilter,
} from './list-query'

describe('appointment list queries', () => {
  it('bounds page size and page number', () => {
    expect(AppointmentListQuerySchema.safeParse({ page: '0' }).success).toBe(false)
    expect(AppointmentListQuerySchema.safeParse({ limit: '201' }).success).toBe(false)
  })

  it('uses overlap semantics for date ranges', () => {
    const query = AppointmentListQuerySchema.parse({
      start: '2026-09-12T09:00:00+02:00',
      end: '2026-09-12T10:00:00+02:00',
    })

    expect(buildAppointmentListFilter(query, 'business-1')).toEqual({
      businessId: 'business-1',
      endTime: { $gt: new Date('2026-09-12T09:00:00+02:00') },
      startTime: { $lt: new Date('2026-09-12T10:00:00+02:00') },
    })
  })

  it('rejects a reversed range', () => {
    expect(AppointmentListQuerySchema.safeParse({
      start: '2026-09-12T10:00:00Z',
      end: '2026-09-12T09:00:00Z',
    }).success).toBe(false)
  })
})
