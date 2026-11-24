import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * Guardia de dependencias — appointments-2026-11-07-011.
 *
 * El servidor MCP declaraba e instalaba @modelcontextprotocol/sdk 1.30.0,
 * dentro del rango vulnerable <=1.31.0 (confirmado con `npm audit` en mcp/):
 *  - GHSA-6qxp-vccf-f47h: el cliente OAuth podía enviar credenciales a un
 *    servidor de autorización elegido por el servidor MCP.
 *  - GHSA-22jm-h49p-29qw: las tareas experimentales no se ligaban a la
 *    sesión que las creó.
 *  - GHSA-46jr-4wx8-v453: una petición HTTP dentro del límite por defecto
 *    agotaba la memoria del servidor al validarla.
 *  - GHSA-rvq5-wwqv-78pq: la autenticación bearer aceptaba tokens emitidos
 *    para otro servicio.
 *  - GHSA-f897-62hf-6gxq: los transports HTTP no limitaban el tamaño del
 *    cuerpo ni la longitud de los lotes JSON-RPC.
 *  - GHSA-6prh-2h8m-c8cw: el cliente HTTP seguía redirects cross-origin
 *    reenviando cabeceras y cuerpo de la petición.
 *
 * La versión mínima aceptada es 1.32.0 (el fix de npm audit). Si este test
 * falla, el servidor MCP vuelve a quedar dentro del rango vulnerable; súbelo
 * de versión, no lo saltes.
 */

const MIN_PATCHED = [1, 32, 0]

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

describe('guardia de dependencias: SDK de MCP parcheado (appointments-2026-11-07-011)', () => {
  it('mcp/package.json declara @modelcontextprotocol/sdk >= 1.32.0', () => {
    const pkg = JSON.parse(readFileSync('mcp/package.json', 'utf8')) as {
      dependencies: { '@modelcontextprotocol/sdk': string }
    }
    expect(
      isAtLeast(baseVersion(pkg.dependencies['@modelcontextprotocol/sdk']), MIN_PATCHED),
    ).toBe(true)
  })

  it('mcp/package-lock.json resuelve @modelcontextprotocol/sdk >= 1.32.0', () => {
    const lock = JSON.parse(readFileSync('mcp/package-lock.json', 'utf8')) as {
      packages: Record<string, { version?: string }>
    }
    const resolved = lock.packages['node_modules/@modelcontextprotocol/sdk']?.version ?? ''
    expect(isAtLeast(resolved, MIN_PATCHED)).toBe(true)
  })

  it('mcp/node_modules instala @modelcontextprotocol/sdk >= 1.32.0', () => {
    const sdk = JSON.parse(
      readFileSync('mcp/node_modules/@modelcontextprotocol/sdk/package.json', 'utf8'),
    ) as { version: string }
    expect(isAtLeast(sdk.version, MIN_PATCHED)).toBe(true)
  })
})
