import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('keeps only the used radix-ui entry point as a direct dependency (028)', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
  expect(pkg.dependencies['radix-ui']).toBeDefined()
  for (const name of ['@radix-ui/react-dialog', '@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-slot']) {
    expect(pkg.dependencies[name]).toBeUndefined()
    expect(lock.packages[''].dependencies[name]).toBeUndefined()
  }
})
