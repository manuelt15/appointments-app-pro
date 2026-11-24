import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('provides a focus-visible skip link before the sidebar to a focusable main (017)', () => {
  const source = readFileSync('app/(main)/layout.tsx', 'utf8')
  const link = source.match(/<a\s[^>]*href="#main-content"[^>]*>[\s\S]*?<\/a>/)?.[0]
  expect(link).toBeDefined()
  expect(source.indexOf(link!)).toBeLessThan(source.indexOf('<Sidebar'))
  expect(link).toContain('sr-only')
  expect(link).toContain('focus:not-sr-only')
  expect(link).toContain('Skip to main content')
  expect(source).toMatch(/<main\s[^>]*id="main-content"[^>]*tabIndex=\{-1\}/)
})
