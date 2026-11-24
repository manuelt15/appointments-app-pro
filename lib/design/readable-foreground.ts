const HEX_6 = /^#[0-9a-f]{6}$/
const HEX_3 = /^#[0-9a-f]{3}$/

function channel(value: number): number {
  const s = value / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16)
  return (
    0.2126 * channel((value >> 16) & 0xff) +
    0.7152 * channel((value >> 8) & 0xff) +
    0.0722 * channel(value & 0xff)
  )
}

function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * Readable text color for shift chips painted with an employee's color.
 *
 * Returns pure `#000000` or `#ffffff`, whichever contrasts more: for any
 * background, the better of the two is always >= 4.58:1 (WCAG 2.x), and as
 * literals they hold in both themes. Softer inks are not enough — e.g.
 * `#171717` over the Vercel blue `#0070f3` of the palette stays below 4,5:1.
 *
 * Anything that is not a hex color (the `--faint` of absence events, the
 * `--foreground` fallback) keeps `--primary-foreground`: the pair already
 * painted today and guarded by `lib/design/wcag-contrast.test.ts`.
 */
export function readableForeground(background: string): string {
  const color = background.trim().toLowerCase()
  let hex: string | null = null
  if (HEX_6.test(color)) hex = color
  else if (HEX_3.test(color)) {
    hex = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
  }
  if (!hex) return 'var(--primary-foreground)'
  return contrast('#000000', hex) >= contrast('#ffffff', hex) ? '#000000' : '#ffffff'
}
