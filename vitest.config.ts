import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\/(.*)$/, replacement: path.resolve(__dirname, '.') + '/$1' }],
  },
  test: {
    environment: 'node',
  },
})
