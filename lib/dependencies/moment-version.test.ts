import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))

describe('patched moment (appointments-2026-11-07-029)', () => {
  it('declares a minimum version with the locale traversal fix', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(pkg.dependencies.moment).toBe('^2.31.0')
    expect(lock.packages[''].dependencies.moment).toBe('^2.31.0')
  })
  it('resolves every installed and locked moment to the patched version', () => {
    for (const [path, entry] of Object.entries(lock.packages)) {
      if (path.endsWith('node_modules/moment')) expect((entry as { version: string }).version).toBe('2.31.0')
    }
    expect(JSON.parse(readFileSync('node_modules/moment/package.json', 'utf8')).version).toBe('2.31.0')
  })
})
