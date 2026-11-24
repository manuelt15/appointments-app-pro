import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderInLocale } from '@/lib/i18n/test-locale'
import { ConnectAgentGuide } from './ConnectAgentGuide'
import { AgentSetupPrompt } from './AgentSetupPrompt'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const ORIGIN = 'https://app.example'

/** Visible text of the markup, with the tags removed. */
function visibleText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

function renderGuide(locale: 'es' | 'en') {
  return renderInLocale(locale, createElement(ConnectAgentGuide, { origin: ORIGIN }))
}

function renderPrompt(locale: 'es' | 'en') {
  return renderInLocale(locale, createElement(AgentSetupPrompt, { origin: ORIGIN }))
}

describe.each(['es', 'en'] as const)('connection guide in %s', (locale) => {
  const html = renderGuide(locale)

  it('leaves no emphasis marker in the visible text', () => {
    const text = visibleText(html)
    expect(text).not.toContain('**')
    expect(text).not.toContain('`')
    expect(text).not.toContain('~')
  })

  it('keeps the code blocks, the file name and the command that is copied', () => {
    expect(html).toContain('.mcp.json')
    expect(html).toContain('MCP_API_URL')
    expect(html).toContain('npm ci')
    expect(html).toContain(ORIGIN)
  })

  it('keeps the step numbering in the headings', () => {
    expect(html).toContain('<span aria-hidden="true"')
    expect(visibleText(html)).toContain(locale === 'es' ? 'Paso 6:' : 'Step 6:')
  })
})

describe.each(['es', 'en'] as const)('setup prompt block in %s', (locale) => {
  const html = renderPrompt(locale)

  it('translates the copy around the prompt and names the row of agents', () => {
    expect(html).toContain(locale === 'es' ? 'Funciona con' : 'Works with')
    expect(html).toContain(locale === 'es' ? 'Texto para pegar en tu agente' : 'Prompt to paste in your agent')
  })

  it('never translates the prompt: an agent reads it, not the person', () => {
    expect(html).toContain('Set up the MCP server for this shift schedule app')
    expect(html).toContain('Never invent it')
  })
})

describe('the prompt is the same in both languages', () => {
  it('renders the identical prompt text', () => {
    function promptText(locale: 'es' | 'en') {
      const html = renderPrompt(locale)
      const match = html.match(/<code>([\s\S]*?)<\/code>/)
      return match?.[1] ?? ''
    }
    expect(promptText('es')).toBe(promptText('en'))
    expect(promptText('es').length).toBeGreaterThan(500)
  })
})
