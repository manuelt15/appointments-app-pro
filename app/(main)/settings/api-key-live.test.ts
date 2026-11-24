import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const source = readFileSync('app/(main)/settings/page.tsx', 'utf8')
const tree = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

describe('API key announcements (appointments-2026-11-07-018)', () => {
  it('never renders the secret inside an explicit or implicit live region', () => {
    const liveRegions: string[] = []
    function visit(node: ts.Node) {
      if (ts.isJsxElement(node)) {
        const attrs = node.openingElement.attributes.getText(tree)
        if (/aria-live=|role="(?:status|alert|log)"/.test(attrs)) liveRegions.push(node.getText(tree))
      }
      ts.forEachChild(node, visit)
    }
    visit(tree)
    expect(liveRegions.length).toBeGreaterThan(0)
    for (const region of liveRegions) {
      expect(region).not.toContain('{newKey}')
      expect(region).not.toContain('<code')
    }
    expect(liveRegions.some((region) => region.includes('API key generated.'))).toBe(true)
  })

  it('keeps the key readable and copyable outside the announcement', () => {
    expect(source).toMatch(/<code[^>]*>\{newKey\}<\/code>/)
    expect(source).toContain('navigator.clipboard.writeText(newKey)')
  })
})
