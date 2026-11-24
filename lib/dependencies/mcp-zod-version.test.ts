import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * Guardia de dependencias — appointments-2026-11-07-010.
 *
 * El MCP declaraba zod ^3.0.0 y resolvía 3.25.76, dentro del rango
 * vulnerable < 4.6.6 (confirmado con `npm audit` en mcp/):
 *  - GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404: el handleArrayResult de
 *    $ZodArray acumula un issue de validación por cada elemento que falla
 *    sin tope ni terminación temprana, de modo que un array gigante contra
 *    un esquema de array sin cota agota la memoria del proceso (CWE-770,
 *    CVSS 7.5). Los argumentos de las tools llegan por stdio desde el
 *    cliente MCP, así que cualquier cliente puede disparar la validación.
 *
 * El advisory no parchea ninguna versión 3.x (parche: 4.6.6), así que la
 * actualización es un salto de major de la dependencia directa del MCP.
 * El SDK 1.32.2 da soporte dual a zod 3 y 4 (detecta el schema por _zod y
 * convierte con zod/v4-mini.toJSONSchema), la app raíz ya usa zod 4 y las
 * APIs usadas en mcp/src/index.ts existen en zod 4 tal cual. La versión
 * mínima aceptada es 4.6.6. Si este test falla, el servidor MCP vuelve a
 * quedar dentro del rango vulnerable; súbelo de versión, no lo saltes.
 */

const MIN_PATCHED = [4, 6, 6]

function isAtLeast(version: string, min: number[]): boolean {
  const parts = version.split('.').map((n) => Number.parseInt(n, 10))
  for (let i = 0; i < min.length; i += 1) {
    const got = parts[i] ?? 0
    if (got !== min[i]) return got > min[i]
  }
  return true
}

describe('guardia de dependencias: zod del MCP parcheado (appointments-2026-11-07-010)', () => {
  it('mcp/package.json declara zod con suelo >= 4.6.6', () => {
    const pkg = JSON.parse(readFileSync('mcp/package.json', 'utf8')) as {
      dependencies: Record<string, string>
    }
    const declared = pkg.dependencies.zod ?? ''
    const floor = declared.match(/\d+\.\d+\.\d+/)?.[0] ?? '0.0.0'
    expect(isAtLeast(floor, MIN_PATCHED)).toBe(true)
  })

  it('mcp/package-lock.json resuelve zod >= 4.6.6', () => {
    const lock = JSON.parse(readFileSync('mcp/package-lock.json', 'utf8')) as {
      packages: Record<string, { version?: string }>
    }
    const resolved = lock.packages['node_modules/zod']?.version ?? ''
    expect(isAtLeast(resolved, MIN_PATCHED)).toBe(true)
  })

  it('mcp/node_modules instala zod >= 4.6.6', () => {
    const pkg = JSON.parse(
      readFileSync('mcp/node_modules/zod/package.json', 'utf8'),
    ) as { version: string }
    expect(isAtLeast(pkg.version, MIN_PATCHED)).toBe(true)
  })
})
