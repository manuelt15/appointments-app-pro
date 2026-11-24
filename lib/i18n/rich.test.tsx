import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { richText } from './rich'

describe('richText', () => {
  it('leaves a string without markers as plain text', () => {
    expect(renderToStaticMarkup(<p>{richText('Solo texto')}</p>)).toBe('<p>Solo texto</p>')
  })

  it('turns the marked parts into bold, code and italic, in the original order', () => {
    const html = renderToStaticMarkup(
      <p>{richText('Sube hasta **Crear clave** y usa `Claude Code`, por ejemplo ~«hola»~.')}</p>,
    )
    expect(html).toBe(
      '<p>Sube hasta <strong>Crear clave</strong> y usa <code class="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">Claude Code</code>, por ejemplo <em>«hola»</em>.</p>',
    )
  })

  it('accepts the strong style of the caller, so legal text keeps its look', () => {
    const html = renderToStaticMarkup(
      <p>{richText('El responsable es **[RESPONSABLE LEGAL]**.', { strong: 'font-medium text-foreground' })}</p>,
    )
    expect(html).toContain('<strong class="font-medium text-foreground">[RESPONSABLE LEGAL]</strong>')
  })

  it('keeps brackets, placeholders and code untouched', () => {
    expect(renderToStaticMarkup(<p>{richText('`MCP_API_URL` vale [EMAIL DE CONTACTO]')}</p>)).toContain(
      'vale [EMAIL DE CONTACTO]',
    )
  })
})
