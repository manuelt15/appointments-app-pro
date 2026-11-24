import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Guardia de dependencias — appointments-2026-11-07-015.
 *
 * La app raiz declaraba zod ^4.3.6 y el lock fijaba 4.3.6, dentro del rango
 * vulnerable < 4.6.6 (confirmado con `npm audit` en la raiz):
 *  - GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404: handleArrayResult en $ZodArray
 *    acumula un issue de validacion por cada elemento que falla sin tope ni
 *    terminacion temprana cuando el esquema tiene una cota de longitud
 *    (CWE-770, CVSS 7.5). Un array gigante contra un esquema acotado agota la
 *    memoria del proceso. Los cuerpos JSON de las rutas /api/* llegan de
 *    peticiones externas y se validan con este zod, asi que la dependencia
 *    directa en rango vulnerable es exposicion real aunque hoy la app no
 *    declare ningun z.array: lo hacen los esquemas nuevos y cualquier camino
 *    que parse colecciones acotadas.
 *
 * Parche: 4.6.6 (subida a ^4.6.6, que resuelve 4.6.7 — la misma version que
 * ya corre el MCP desde el -010). La version minima aceptada es 4.6.6. Si
 * este test falla, la app vuelve a quedar dentro del rango vulnerable;
 * subelo de version, no lo saltes.
 *
 * El cuarto test guarda el comportamiento del parche, no solo la version:
 * con 4.3.6, z.array(z.string()).max(10) contra 20.000 elementos fallidos
 * devolvia 20.001 issues (uno por elemento mas el de longitud, medido en
 * la sonda RED); con 4.6.7 devuelve 1 issue porque la cota rompe la
 * validacion de elementos en cuanto se viola (terminacion temprana).
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

describe('guardia de dependencias: zod de la app parcheado (appointments-2026-11-07-015)', () => {
  it('package.json declara zod con suelo >= 4.6.6', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
      dependencies: Record<string, string>
    }
    const declared = pkg.dependencies.zod ?? ''
    const floor = declared.match(/\d+\.\d+\.\d+/)?.[0] ?? '0.0.0'
    expect(isAtLeast(floor, MIN_PATCHED)).toBe(true)
  })

  it('package-lock.json resuelve zod >= 4.6.6', () => {
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as {
      packages: Record<string, { version?: string }>
    }
    const resolved = lock.packages['node_modules/zod']?.version ?? ''
    expect(isAtLeast(resolved, MIN_PATCHED)).toBe(true)
  })

  it('node_modules instala zod >= 4.6.6', () => {
    const pkg = JSON.parse(
      readFileSync('node_modules/zod/package.json', 'utf8'),
    ) as { version: string }
    expect(isAtLeast(pkg.version, MIN_PATCHED)).toBe(true)
  })

  it('un array acotado termina pronto: la cota no acumula un issue por elemento', () => {
    const schema = z.array(z.string()).max(10)
    const result = schema.safeParse(new Array(20_000).fill(42))
    expect(result.success).toBe(false)
    // 4.3.6 acumula 20.001 issues; el parche corta en cuanto la cota se viola.
    expect(result.error?.issues.length ?? 0).toBeLessThan(100)
  })
})
