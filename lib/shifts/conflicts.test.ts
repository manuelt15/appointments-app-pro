import { describe, expect, it } from 'vitest'
import { buildConflictFilter } from './conflicts'

const range = {
  startTime: '2026-09-12T09:00:00.000Z',
  endTime: '2026-09-12T10:00:00.000Z',
}

describe('shift conflict filters', () => {
  it('scopes conflicts to the business and the employee', () => {
    const filter = buildConflictFilter({
      businessId: 'business-1',
      employeeId: 'employee-1',
      ...range,
    })

    expect(filter).toMatchObject({
      businessId: 'business-1',
      employeeId: 'employee-1',
    })
  })

  it('detects any interval that crosses the requested range', () => {
    const filter = buildConflictFilter({
      businessId: 'business-1',
      employeeId: 'employee-1',
      ...range,
    })

    expect(filter.startTime.$lt).toEqual(new Date(range.endTime))
    expect(filter.endTime.$gt).toEqual(new Date(range.startTime))
  })

  it('excludes the shift being moved or resized', () => {
    const filter = buildConflictFilter({
      businessId: 'business-1',
      employeeId: 'employee-1',
      ...range,
      excludeShiftId: 'shift-1',
    })

    expect(filter).toMatchObject({ _id: { $ne: 'shift-1' } })
  })

  it('does not clash across different employees', () => {
    const ana = buildConflictFilter({ businessId: 'business-1', employeeId: 'ana', ...range })
    const carlos = buildConflictFilter({ businessId: 'business-1', employeeId: 'carlos', ...range })

    expect(ana.employeeId).not.toBe(carlos.employeeId)
  })
})
