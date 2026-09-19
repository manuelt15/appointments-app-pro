import { describe, expect, it } from 'vitest'
import {
  CreateShiftSchema,
  UpdateShiftSchema,
  isValidTimeRange,
} from './validation'

const validShift = {
  employeeId: '507f1f77bcf86cd799439011',
  startTime: '2026-09-12T09:00:00.000Z',
  endTime: '2026-09-12T17:00:00.000Z',
}

describe('shift time ranges', () => {
  it('accepts an end time after the start time', () => {
    expect(CreateShiftSchema.safeParse(validShift).success).toBe(true)
  })

  it('rejects an end time equal to the start time', () => {
    const result = CreateShiftSchema.safeParse({
      ...validShift,
      endTime: validShift.startTime,
    })

    expect(result.success).toBe(false)
  })

  it('rejects an end time before the start time', () => {
    const result = CreateShiftSchema.safeParse({
      ...validShift,
      endTime: '2026-09-12T08:00:00.000Z',
    })

    expect(result.success).toBe(false)
  })

  it('validates the final range used by a partial update', () => {
    expect(isValidTimeRange(validShift.startTime, '2026-09-12T08:00:00.000Z')).toBe(false)
  })
})

describe('shift types', () => {
  it('defaults to a working shift', () => {
    expect(CreateShiftSchema.parse(validShift).type).toBe('shift')
  })

  it('accepts time off as a first-class type', () => {
    expect(CreateShiftSchema.safeParse({ ...validShift, type: 'vacation' }).success).toBe(true)
    expect(CreateShiftSchema.safeParse({ ...validShift, type: 'sick_leave' }).success).toBe(true)
  })

  it('rejects a type outside the catalogue', () => {
    expect(CreateShiftSchema.safeParse({ ...validShift, type: 'meeting' }).success).toBe(false)
  })
})

describe('shift updates', () => {
  it('keeps employeeId instead of silently stripping it', () => {
    const result = UpdateShiftSchema.parse({ employeeId: '507f1f77bcf86cd799439012' })

    expect(result.employeeId).toBe('507f1f77bcf86cd799439012')
  })

  it('rejects an invalid range when both dates are updated', () => {
    const result = UpdateShiftSchema.safeParse({
      startTime: validShift.startTime,
      endTime: '2026-09-12T08:00:00.000Z',
    })

    expect(result.success).toBe(false)
  })

  it('rejects malformed employee IDs before querying MongoDB', () => {
    expect(UpdateShiftSchema.safeParse({ employeeId: 'not-an-object-id' }).success).toBe(false)
  })
})
