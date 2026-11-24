const DAY_MS = 24 * 60 * 60 * 1000

/** Whole days left until the key expires. Negative when it already expired. */
export function daysUntil(iso: string, now: number = Date.now()): number {
  return Math.ceil((new Date(iso).getTime() - now) / DAY_MS)
}

/**
 * Expiry label for the key list. A key that already expired is labelled
 * "Expired" instead of a countdown, so it is visible without opening anything.
 */
export function expiryLabel(iso: string | undefined, now: number = Date.now()): { label: string; expired: boolean } {
  if (!iso) return { label: 'No expiry date', expired: false }
  const days = daysUntil(iso, now)
  if (days <= 0) return { label: 'Expired', expired: true }
  return { label: `Expires in ${days} day${days === 1 ? '' : 's'}`, expired: false }
}

/** Usage label: "Never used" or "Last used 2 days ago". */
export function lastUsedLabel(iso: string | undefined, now: number = Date.now()): string {
  if (!iso) return 'Never used'
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS)
  if (days <= 0) return 'Last used today'
  return `Last used ${days} day${days === 1 ? '' : 's'} ago`
}
