/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS test harness. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')

function atLeast(version, minimum) {
  const a = version.split('.').map(Number)
  const b = minimum.split('.').map(Number)
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i]
  }
  return true
}

for (const [path, minimums] of [
  ['package-lock.json', {
    next: '16.4.5', sharp: '0.35.5', zod: '4.6.6',
    'source-map-js': '1.2.2', vite: '7.3.8', undici: '7.30.1',
    shadcn: '4.23.0', systeminformation: '5.33.16',
  }],
  ['mcp/package-lock.json', {
    '@modelcontextprotocol/sdk': '1.32.2', zod: '4.6.6',
    '@hono/node-server': '2.1.3', 'body-parser': '2.4.0',
    'fast-uri': '3.1.9', hono: '4.13.11', 'ip-address': '10.7.4', qs: '6.16.1',
  }],
]) {
  test(`${path}: patched lock resolutions (appointments-2026-11-10-003)`, () => {
    const lock = JSON.parse(fs.readFileSync(path, 'utf8'))
    for (const [name, minimum] of Object.entries(minimums)) {
      const version = lock.packages[`node_modules/${name}`]?.version
      assert.ok(version, `${name} must remain resolved`)
      assert.ok(atLeast(version, minimum), `${name} ${version} must be >= ${minimum}`)
    }
  })
}

test('root no longer resolves the obsolete SDK/proxy-addr/zod brought in by shadcn', () => {
  const { packages } = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'))
  for (const path of ['node_modules/@modelcontextprotocol/sdk', 'node_modules/proxy-addr', 'node_modules/shadcn/node_modules/zod']) {
    assert.equal(packages[path], undefined, path)
  }
})
