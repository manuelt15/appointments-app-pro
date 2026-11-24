import type { ReactNode } from 'react'

/**
 * Renders a translated string that carries its own emphasis.
 *
 * The dictionary stays flat (`t()` only interpolates `{param}`), so a sentence
 * with a bold word or an inline code sample could only be translated as three
 * fragments, in an order that only works in one language. Marking the emphasis
 * inside the entry keeps the whole sentence in one place, and each language
 * keeps its own word order.
 *
 * Markers: **bold**, `code`, ~italic~.
 */
export type RichStyle = {
  strong?: string
  code?: string
  em?: string
}

const DEFAULT_STYLE: RichStyle = {
  code: 'rounded-sm bg-muted px-1 py-0.5 font-mono text-xs',
}

const MARKER = /(\*\*[^*]+\*\*|`[^`]+`|~[^~]+~)/g

export function richText(text: string, style: RichStyle = {}): ReactNode[] {
  const classes = { ...DEFAULT_STYLE, ...style }
  return text
    .split(MARKER)
    .filter((part) => part !== '')
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className={classes.strong}>
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className={classes.code}>
            {part.slice(1, -1)}
          </code>
        )
      }
      if (part.startsWith('~') && part.endsWith('~')) {
        return (
          <em key={index} className={classes.em}>
            {part.slice(1, -1)}
          </em>
        )
      }
      return part
    })
}
