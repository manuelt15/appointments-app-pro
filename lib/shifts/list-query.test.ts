import { describe, expect, it } from 'vitest'
import { ShiftListQuerySchema, buildShiftListFilter } from './list-query'

describe('shift list queries', () => {
  it('bounds page size and page number', () => {
    expect(ShiftListQuerySchema.safeParse({ page: '0' }).success).toBe(false)
    expect(ShiftListQuerySchema.safeParse({ limit: '201' }).success).toBe(false)
  })

  it('uses overlap semantics for date ranges', () => {
    const query = ShiftListQuerySchema.parse({
      start: '2026-09-12T09:00:00+02:00',
      end: '2026-09-12T10:00:00+02:00',
    })

    expect(buildShiftListFilter(query, 'business-1')).toEqual({
      businessId: 'business-1',
      endTime: { $gt: new Date('2026-09-12T09:00:00+02:00') },
      startTime: { $lt: new Date('2026-09-12T10:00:00+02:00') },
    })
  })

  it('filters by employee and by type', () => {
    const query = ShiftListQuerySchema.parse({
      employee_id: '507f1f77bcf86cd799439011',
      type: 'vacation',
    })

    expect(buildShiftListFilter(query, 'business-1')).toEqual({
      businessId: 'business-1',
      employeeId: '507f1f77bcf86cd799439011',
      type: 'vacation',
    })
  })

  it('rejects a reversed range', () => {
    expect(ShiftListQuerySchema.safeParse({
      start: '2026-09-12T10:00:00Z',
      end: '2026-09-12T09:00:00Z',
    }).success).toBe(false)
  })
})
