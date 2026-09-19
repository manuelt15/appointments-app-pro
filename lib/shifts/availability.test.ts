import { describe, expect, it } from 'vitest'
import { CoverageQuerySchema, buildCoverageFilter } from './availability'

const interval = {
  start_time: '2026-09-12T09:00:00+02:00',
  end_time: '2026-09-12T10:00:00+02:00',
}

const employeeId = '507f1f77bcf86cd799439012'

describe('coverage query', () => {
  it('accepts ISO timestamps with an offset', () => {
    expect(CoverageQuerySchema.safeParse(interval).success).toBe(true)
  })

  it('does not require an employee: the whole roster is a valid question', () => {
    expect(CoverageQuerySchema.safeParse(interval).success).toBe(true)
    expect(CoverageQuerySchema.safeParse({ ...interval, employee_id: employeeId }).success).toBe(true)
  })

  it('rejects reversed intervals', () => {
    expect(CoverageQuerySchema.safeParse({
      start_time: interval.end_time,
      end_time: interval.start_time,
    }).success).toBe(false)
  })

  it('builds a business-scoped overlap lookup', () => {
    const query = CoverageQuerySchema.parse(interval)

    expect(buildCoverageFilter(query, 'business-1')).toEqual({
      businessId: 'business-1',
      startTime: { $lt: new Date(interval.end_time) },
      endTime: { $gt: new Date(interval.start_time) },
    })
  })

  it('narrows to a single employee when asked', () => {
    const query = CoverageQuerySchema.parse({ ...interval, employee_id: employeeId })

    expect(buildCoverageFilter(query, 'business-1')).toMatchObject({ employeeId })
  })
})
