import { describe, expect, it } from 'vitest'
import { EMPLOYEE_PERSONAL_FIELDS, buildEmployeeAnonymization } from './Employee'

const NOW = new Date('2026-11-24T09:00:00.000Z')

function anonymizationSet(now: Date = NOW): Record<string, unknown> {
  const [stage] = buildEmployeeAnonymization(now)
  return (stage as { $set: Record<string, unknown> }).$set
}

describe('employee anonymisation on delete', () => {
  it('clears email, phone and birthday', () => {
    const set = anonymizationSet()

    for (const field of EMPLOYEE_PERSONAL_FIELDS) {
      expect(set[field], field).toBeNull()
    }
  })

  it('writes null, never undefined: undefined in $set would keep the old value', () => {
    const set = anonymizationSet()

    for (const field of EMPLOYEE_PERSONAL_FIELDS) {
      expect(set[field]).not.toBeUndefined()
      expect(Object.keys(set)).toContain(field)
    }
  })

  it('deactivates the employee and stamps the moment', () => {
    const set = anonymizationSet()

    expect(set.isActive).toBe(false)
    expect(set.anonymizedAt).toEqual({ $ifNull: ['$anonymizedAt', NOW] })
  })

  it('keeps what past shifts need to stay readable', () => {
    const set = anonymizationSet()

    for (const field of ['_id', 'fullName', 'color', 'businessId', 'startDate', 'createdAt', 'updatedAt']) {
      expect(set, field).not.toHaveProperty(field)
    }
  })

  it('does not overwrite an anonymizedAt already set (deleting twice is idempotent)', () => {
    const set = anonymizationSet()

    // $ifNull keeps the stored value, so a second DELETE cannot move the date.
    expect(set.anonymizedAt).toMatchObject({ $ifNull: ['$anonymizedAt', expect.any(Date)] })
    expect(set).not.toHaveProperty('$unset')
  })
})
