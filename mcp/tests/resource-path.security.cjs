/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node CommonJS test harness. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('../../node_modules/typescript')
const { z } = require('../node_modules/zod')

// Real source handlers, in-memory principals and no network/database connections.
function load(file, dependencies) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const loadedModule = { exports: {} }
  vm.runInNewContext(code, {
    module: loadedModule, exports: loadedModule.exports, console: { error() {} }, Date, URL, URLSearchParams,
    require(name) {
      if (name === 'zod') return { z }
      if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`)
      return dependencies[name]
    },
  }, { filename: file })
  return loadedModule.exports
}

for (const file of ['mcp/src/index.ts', 'mcp/dist/index.js']) {
  test(`${file}: delete_shift cannot become employee deletion`, async () => {
    const effects = []
    const employeeId = '000000000000000000000001'
    const employeeRoute = load('app/api/employees/[id]/route.ts', {
      'next/server': {},
      '@/lib/api/auth': { resolveAuth: async () => ({ businessId: 'business-a', authType: 'api_key' }) },
      '@/lib/api/response': { apiSuccess: data => Response.json({ data }), apiError: (error, status) => Response.json({ error }, { status }) },
      '@/lib/mongodb/client': { connectDB: async () => {} },
      '@/lib/shifts/calendar-date': { isCalendarDate: () => true },
      '@/lib/shifts/scheduling-lock': {
        SchedulingBusyError: class extends Error {},
        withSchedulingLock: async (_business, _employee, operation) => operation({ assertOwned: async () => {} }, null),
      },
      '@/lib/mongodb/models/Employee': { Employee: {
        findOne: async () => ({ _id: employeeId }),
        updateOne: async (_filter, update) => effects.push(update),
      } },
      '@/lib/mongodb/models/Shift': { Shift: { deleteMany: async () => effects.push('future shifts deleted') } },
    })
    const tools = {}
    class McpServer {
      tool(name, _description, schema, callback) { tools[name] = { schema: z.object(schema), callback } }
      async connect() {}
    }
    const calls = []
    async function apiCall(path, options) {
      const url = new URL(path, 'http://fixture.invalid')
      calls.push({ path: url.pathname, method: options.method })
      if (url.pathname === `/api/employees/${employeeId}`) {
        const response = await employeeRoute.DELETE(new Request(url, { method: 'DELETE' }), {
          params: Promise.resolve({ id: employeeId }),
        })
        return (await response.json()).data
      }
      return { deleted: true }
    }
    load(file, {
      '@modelcontextprotocol/sdk/server/mcp.js': { McpServer },
      '@modelcontextprotocol/sdk/server/stdio.js': { StdioServerTransport: class {} },
      './client.js': { apiCall, apiCallWithMeta: async () => ({ data: [], meta: { total: 0 } }) },
    })
    const tool = tools.delete_shift
    const invalid = tool.schema.safeParse({ id: `../employees/${employeeId}` })
    if (invalid.success) await tool.callback(invalid.data)
    assert.deepEqual(effects, [], 'Deleting a shift must never deactivate an employee or delete their future shifts')
    assert.equal(invalid.success, false, 'Traversal must be rejected before HTTP dispatch')
    for (const id of ['../api-keys/x', '%2e%2e/employees/x', 'a/b', 'x?y', 'x#y', '', '0'.repeat(25)]) {
      assert.equal(tool.schema.safeParse({ id }).success, false, id)
      assert.equal(tools.update_shift.schema.safeParse({ id }).success, false, id)
    }
    const valid = tool.schema.parse({ id: employeeId })
    await tool.callback(valid)
    assert.deepEqual(calls, [{ path: `/api/shifts/${employeeId}`, method: 'DELETE' }])
  })
}
