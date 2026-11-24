import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AgentIconRow } from './AgentIconRow'
import { AGENT_LOGOS } from './AgentLogos'

const markup = renderToStaticMarkup(<AgentIconRow />)

describe('AgentIconRow', () => {
  it('is a list of the agents, not a row of pictures', () => {
    expect(markup).toContain('<ul')
    expect(markup).toContain('<li')
    expect(markup).not.toContain('<img')
  })

  it('shows every agent of the row', () => {
    for (const agent of AGENT_LOGOS) {
      expect(markup).toContain(agent.name)
    }
  })

  it('draws the marks inline, in the colour of the theme', () => {
    expect(markup).toContain('<svg')
    expect(markup).toContain('fill="currentColor"')
  })

  it('gives every mark an accessible name, so the glyph is not the only carrier', () => {
    for (const agent of AGENT_LOGOS) {
      expect(markup).toContain(`aria-label="${agent.name}"`)
      expect(markup).toContain(`<title>${agent.name}</title>`)
    }
  })

  it('leaves no box, border or background behind the marks', () => {
    expect(markup).not.toMatch(/border/)
    expect(markup).not.toMatch(/bg-muted/)
    expect(markup).not.toMatch(/rounded/)
  })
})
