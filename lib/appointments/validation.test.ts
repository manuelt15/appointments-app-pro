import { describe, expect, it } from 'vitest'
import {
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
  isValidTimeRange,
} from './validation'

const validAppointment = {
  title: 'Consultation',
  clientName: 'Jane Doe',
  calendarId: '507f1f77bcf86cd799439011',
  startTime: '2026-09-12T09:00:00.000Z',
  endTime: '2026-09-12T10:00:00.000Z',
}

describe('appointment time ranges', () => {
  it('accepts an end time after the start time', () => {
    expect(CreateAppointmentSchema.safeParse(validAppointment).success).toBe(true)
  })

  it('rejects an end time equal to the start time', () => {
    const result = CreateAppointmentSchema.safeParse({
      ...validAppointment,
      endTime: validAppointment.startTime,
    })

    expect(result.success).toBe(false)
  })

  it('rejects an end time before the start time', () => {
    const result = CreateAppointmentSchema.safeParse({
      ...validAppointment,
      endTime: '2026-09-12T08:00:00.000Z',
    })

    expect(result.success).toBe(false)
  })

  it('validates the final range used by a partial update', () => {
    expect(
      isValidTimeRange(validAppointment.startTime, '2026-09-12T08:00:00.000Z')
    ).toBe(false)
  })
})

describe('appointment updates', () => {
  it('keeps calendarId instead of silently stripping it', () => {
    const result = UpdateAppointmentSchema.parse({ calendarId: '507f1f77bcf86cd799439012' })

    expect(result.calendarId).toBe('507f1f77bcf86cd799439012')
  })

  it('rejects an invalid range when both dates are updated', () => {
    const result = UpdateAppointmentSchema.safeParse({
      startTime: validAppointment.startTime,
      endTime: '2026-09-12T08:00:00.000Z',
    })

    expect(result.success).toBe(false)
  })

  it('rejects malformed calendar IDs before querying MongoDB', () => {
    expect(UpdateAppointmentSchema.safeParse({ calendarId: 'not-an-object-id' }).success).toBe(false)
  })

  it('keeps email validation consistent with creation', () => {
    expect(UpdateAppointmentSchema.safeParse({ clientEmail: 'not-an-email' }).success).toBe(false)
  })
})
