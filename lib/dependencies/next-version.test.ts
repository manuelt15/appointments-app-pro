import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * Guardia de dependencias — appointments-2026-11-07-001.
 *
 * next 16.3.5 está por debajo de las versiones que corrigen varias RCE
 * críticas sin autenticar (confirmado con OSV.dev):
 *  - GHSA-2464-fhr4-w9xw: RCE no autenticada en Image Optimization API con SVG (corregida en 16.4.1)
 *  - GHSA-vcvr-r3jv-pc5j: RCE en next/og ImageResponse (corregida en 16.3.6)
 *  - GHSA-673q-mjm6-r5xr: RCE no autenticada en funciones `use cache` con typed arrays (corregida en 16.4.1)
 *
 * La versión mínima aceptada es 16.4.5: OSV devuelve 11 avisos para 16.3.5
 * y ninguno para 16.4.5. Si este test falla, la app vuelve a quedar expuesta;
 * súbelo de versión, no lo saltes.
 */

const MIN_PATCHED = [16, 4, 5]

function baseVersion(range: string): string {
  return range.replace(/^[\^~>=< ]*/, '')
}

function isAtLeast(version: string, min: number[]): boolean {
  const parts = version.split('.').map((n) => Number.parseInt(n, 10))
  for (let i = 0; i < min.length; i += 1) {
    const got = parts[i] ?? 0
    if (got !== min[i]) return got > min[i]
  }
  return true
}

describe('guardia de dependencias: next parcheado (appointments-2026-11-07-001)', () => {
  it('package.json declara next >= 16.4.5', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
      dependencies: { next: string }
    }
    expect(isAtLeast(baseVersion(pkg.dependencies.next), MIN_PATCHED)).toBe(true)
  })

  it('node_modules instala next >= 16.4.5 (RCE críticas corregidas)', () => {
    const next = JSON.parse(
      readFileSync('node_modules/next/package.json', 'utf8'),
    ) as { version: string }
    expect(isAtLeast(next.version, MIN_PATCHED)).toBe(true)
  })
})
