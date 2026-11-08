import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('pins the intentional NextAuth beta in manifest and lockfile (014)', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
  expect(pkg.dependencies['next-auth']).toBe('5.0.0-beta.32')
  expect(lock.packages[''].dependencies['next-auth']).toBe('5.0.0-beta.32')
  expect(lock.packages['node_modules/next-auth'].version).toBe('5.0.0-beta.32')
})
