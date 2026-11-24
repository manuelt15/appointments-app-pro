import { describe, expect, it } from 'vitest'
import { agentPrompt } from './agent-prompt'

describe('agentPrompt', () => {
  const prompt = agentPrompt('https://app.example.com')

  it('points the server at the real address of the app', () => {
    expect(prompt).toContain('"MCP_API_URL": "https://app.example.com"')
  })

  it('names the server, the command and the path of the build', () => {
    expect(prompt).toContain('"turnos"')
    expect(prompt).toContain('"command": "node"')
    expect(prompt).toContain('"./mcp/dist/index.js"')
  })

  it('tells the agent to ask for the key instead of inventing it', () => {
    expect(prompt).toContain('Never invent it')
    expect(prompt).toContain('ask me for it')
    expect(prompt).toContain('PASTE_THE_API_KEY_HERE')
  })

  it('tells the agent where the key must never go', () => {
    expect(prompt).toContain('Never put it in a commit')
  })

  it('tells the agent to build and to check the build', () => {
    expect(prompt).toContain('cd mcp && npm ci && npm run build')
    expect(prompt).toContain('mcp/dist/index.js must exist')
  })

  it('tells the agent to reload the servers', () => {
    expect(prompt).toContain('Restart the agent')
  })

  it('tells the agent to show real errors', () => {
    expect(prompt).toContain('show me the real error message and stop')
  })
})
