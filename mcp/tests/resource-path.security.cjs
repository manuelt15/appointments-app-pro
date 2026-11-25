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

// mcp/dist no se versiona: solo se revisa el fuente (y el compilado si alguien lo tiene).
for (const file of ['mcp/src/index.ts', 'mcp/dist/index.js'].filter(candidate => fs.existsSync(candidate))) {
  test(`${file}: delete_shift cannot become employee deletion`, async () => {
    const effects = []
    const employeeId = '000000000000000000000001'
    const employeeFields = load('lib/employees/fields.ts', { zod: { z } })
    const employeeRoute = load('app/api/employees/[id]/route.ts', {
      'next/server': {},
      '@/lib/api/auth': { resolveAuth: async () => ({ businessId: 'business-a', authType: 'api_key' }) },
      '@/lib/api/response': { apiSuccess: data => Response.json({ data }), apiError: (error, status) => Response.json({ error }, { status }) },
      '@/lib/mongodb/client': { connectDB: async () => {} },
      '@/lib/shifts/calendar-date': { isCalendarDate: () => true },
      '@/lib/shifts/validation': {
        employeeIdParam: { safeParse: (value) => ({ success: true, data: value }) },
        canonicalEmployeeId: (value) => value,
      },
      '@/lib/i18n/request': { requestLocale: () => 'es' },
      '@/lib/i18n/translate': { t: (_locale, key) => key },
      '@/lib/shifts/scheduling-lock': {
        SchedulingBusyError: class extends Error {},
        withSchedulingLock: async (_business, _employee, operation) => operation({ assertOwned: async () => {} }, null),
      },
      '@/lib/employees/fields': employeeFields,
      '@/lib/mongodb/models/Employee': {
        Employee: {
          findOne: async () => ({ _id: employeeId }),
          updateOne: async (_filter, update) => effects.push(update),
        },
        // Mismo pipeline que el modelo real: el borrado anonimiza los datos personales.
        buildEmployeeAnonymization: (now = new Date()) => [{
          $set: { isActive: false, email: null, phone: null, birthday: null, anonymizedAt: { $ifNull: ['$anonymizedAt', now] } },
        }],
      },
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
    // Un id de empleado es un ObjectId valido: pasa el esquema, pero solo puede
    // llegar a /api/shifts/:id. El borrado de empleados no se toca.
    assert.deepEqual(effects, [], 'An employee ObjectId must not reach the employee route')
    assert.deepEqual(calls, [{ path: `/api/shifts/${employeeId}`, method: 'DELETE' }])
  })
}
