import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * Guardia de dependencias — appointments-2026-11-07-009.
 *
 * El lockfile de producción del MCP fijaba proxy-addr 2.0.7, dentro del
 * rango vulnerable >= 1.1.0 < 2.0.8 (confirmado con `npm audit` en mcp/):
 *  - GHSA-jqcg-44mw-7w3h / CVE-2026-90711: spoofing de IP vía una trust
 *    subnet IPv4-mapped IPv6 con prefijo corto (::ffff:10.0.0.0/8 en vez
 *    de /104), que se acepta sin error y confía en cualquier dirección
 *    IPv4 de internet, dejando que un cliente sin autenticar controle
 *    req.ip/req.ips con la cabecera X-Forwarded-For (CVSS 9.1).
 *
 * proxy-addr es transitiva: express 5.2.1 la declara ^2.0.7 y cuelga del
 * SDK de MCP, así que el parche no toca mcp/package.json; 2.0.8 satisface
 * el rango declarado y solo cambia el lockfile y node_modules. La versión
 * mínima aceptada es 2.0.8. Si este test falla, el servidor MCP vuelve a
 * quedar dentro del rango vulnerable; súbelo de versión, no lo saltes.
 */

const MIN_PATCHED = [2, 0, 8]

function isAtLeast(version: string, min: number[]): boolean {
  const parts = version.split('.').map((n) => Number.parseInt(n, 10))
  for (let i = 0; i < min.length; i += 1) {
    const got = parts[i] ?? 0
    if (got !== min[i]) return got > min[i]
  }
  return true
}

describe('guardia de dependencias: proxy-addr del MCP parcheado (appointments-2026-11-07-009)', () => {
  it('mcp/package-lock.json resuelve proxy-addr >= 2.0.8', () => {
    const lock = JSON.parse(readFileSync('mcp/package-lock.json', 'utf8')) as {
      packages: Record<string, { version?: string }>
    }
    const resolved = lock.packages['node_modules/proxy-addr']?.version ?? ''
    expect(isAtLeast(resolved, MIN_PATCHED)).toBe(true)
  })

  it('mcp/node_modules instala proxy-addr >= 2.0.8', () => {
    const pkg = JSON.parse(
      readFileSync('mcp/node_modules/proxy-addr/package.json', 'utf8'),
    ) as { version: string }
    expect(isAtLeast(pkg.version, MIN_PATCHED)).toBe(true)
  })
})
