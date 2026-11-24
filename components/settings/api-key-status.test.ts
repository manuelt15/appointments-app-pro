import { describe, expect, it } from 'vitest'
import { expiryLabel, lastUsedLabel } from './api-key-status'

const NOW = new Date('2026-11-24T12:00:00Z').getTime()

describe('expiryLabel', () => {
  it('counts the days left', () => {
    expect(expiryLabel('2026-12-21T12:00:00Z', NOW)).toEqual({ label: 'Expires in 27 days', expired: false })
  })

  it('says one day in singular', () => {
    expect(expiryLabel('2026-11-25T12:00:00Z', NOW)).toEqual({ label: 'Expires in 1 day', expired: false })
  })

  it('marks a past date as expired instead of counting down', () => {
    expect(expiryLabel('2026-11-21T12:00:00Z', NOW)).toEqual({ label: 'Expired', expired: true })
  })

  it('handles a key without expiry date', () => {
    expect(expiryLabel(undefined, NOW)).toEqual({ label: 'No expiry date', expired: false })
  })
})

describe('lastUsedLabel', () => {
  it('says never used when the key was never used', () => {
    expect(lastUsedLabel(undefined, NOW)).toBe('Never used')
  })

  it('counts the days since the last use', () => {
    expect(lastUsedLabel('2026-11-22T12:00:00Z', NOW)).toBe('Last used 2 days ago')
    expect(lastUsedLabel('2026-11-23T12:00:00Z', NOW)).toBe('Last used 1 day ago')
  })

  it('says today for a use in the same day', () => {
    expect(lastUsedLabel('2026-11-24T09:00:00Z', NOW)).toBe('Last used today')
  })
})
