import { describe, expect, it } from 'vitest'
import { expiryLabel, lastUsedLabel } from './api-key-status'

const NOW = new Date('2026-11-24T12:00:00Z').getTime()

// The labels are translated now, so every assertion pins the language instead
// of taking whatever the app has by default (Spanish).
describe('expiryLabel', () => {
  it('counts the days left', () => {
    expect(expiryLabel('2026-12-21T12:00:00Z', 'en', NOW)).toEqual({ label: 'Expires in 27 days', expired: false })
  })

  it('says one day in singular', () => {
    expect(expiryLabel('2026-11-25T12:00:00Z', 'en', NOW)).toEqual({ label: 'Expires in 1 day', expired: false })
  })

  it('marks a past date as expired instead of counting down', () => {
    expect(expiryLabel('2026-11-21T12:00:00Z', 'en', NOW)).toEqual({ label: 'Expired', expired: true })
  })

  it('handles a key without expiry date', () => {
    expect(expiryLabel(undefined, 'en', NOW)).toEqual({ label: 'No expiry date', expired: false })
  })

  it('speaks Spanish with the same meaning and the same singular', () => {
    expect(expiryLabel('2026-12-21T12:00:00Z', 'es', NOW)).toEqual({ label: 'Caduca en 27 días', expired: false })
    expect(expiryLabel('2026-11-25T12:00:00Z', 'es', NOW)).toEqual({ label: 'Caduca en 1 día', expired: false })
    expect(expiryLabel('2026-11-21T12:00:00Z', 'es', NOW)).toEqual({ label: 'Caducada', expired: true })
    expect(expiryLabel(undefined, 'es', NOW)).toEqual({ label: 'Sin fecha de caducidad', expired: false })
  })
})

describe('lastUsedLabel', () => {
  it('says never used when the key was never used', () => {
    expect(lastUsedLabel(undefined, 'en', NOW)).toBe('Never used')
  })

  it('counts the days since the last use', () => {
    expect(lastUsedLabel('2026-11-22T12:00:00Z', 'en', NOW)).toBe('Last used 2 days ago')
    expect(lastUsedLabel('2026-11-23T12:00:00Z', 'en', NOW)).toBe('Last used 1 day ago')
  })

  it('says today for a use in the same day', () => {
    expect(lastUsedLabel('2026-11-24T09:00:00Z', 'en', NOW)).toBe('Last used today')
  })

  it('speaks Spanish with the same meaning and the same singular', () => {
    expect(lastUsedLabel(undefined, 'es', NOW)).toBe('Nunca usada')
    expect(lastUsedLabel('2026-11-22T12:00:00Z', 'es', NOW)).toBe('Usada hace 2 días por última vez')
    expect(lastUsedLabel('2026-11-23T12:00:00Z', 'es', NOW)).toBe('Usada hace 1 día por última vez')
    expect(lastUsedLabel('2026-11-24T09:00:00Z', 'es', NOW)).toBe('Usada hoy por última vez')
  })
})
