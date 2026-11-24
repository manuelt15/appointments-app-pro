import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * Guardia de contraste WCAG 1.4.3 — appointments-2026-11-07-002.
 *
 * Los tokens de texto secundario (`--body`, `--muted-foreground` y `--faint`)
 * se pintan como texto informativo real ("No shifts", "inactive", "Signed in
 * with Google", guion de celda vacía, aviso del ShiftModal, etiqueta del
 * Select) y deben superar 4,5:1 sobre cada superficie donde aparecen:
 *
 *  - `--card` / `--popover` / `--sidebar`: tablas y tiles de Home, chips de
 *    mes del historial, tarjeta del usuario, diálogos y Select.
 *  - `--background`: canvas de la aplicación.
 *  - `--muted`: hover de los chips de mes (`can-hover:hover:bg-muted`).
 *  - celda "hoy": `bg-muted/60` compuesto sobre `--card` (tabla de Home).
 *  - eventos de ausencia: texto `--primary-foreground` sobre fondo `--faint`
 *    (`eventPropGetter` de ShiftCalendar).
 *
 * El test recalcula la fórmula WCAG 2.x (luminancia relativa y ratio de
 * contraste) leyendo `app/globals.css`, sin dependencias externas. Si alguien
 * aclara un token por debajo de AA para texto normal, esto se pone en rojo.
 */

const AA_NORMAL_TEXT = 4.5

type Tokens = Record<string, string>

function blockTokens(css: string, selector: string): Tokens {
  const escaped = selector.replace(/[.]/g, '\\$&')
  const block = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`))?.[1]
  const tokens: Tokens = {}
  if (!block) return tokens
  for (const match of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[match[1]] = match[2].toLowerCase()
  }
  return tokens
}

function linearChannel(value: number): number {
  const s = value / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16)
  const r = linearChannel((value >> 16) & 0xff)
  const g = linearChannel((value >> 8) & 0xff)
  const b = linearChannel(value & 0xff)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Compone `fg` con alfa sobre `bg` opaco, como haría el navegador al pintar. */
function alphaOver(fg: string, alpha: number, bg: string): string {
  const f = Number.parseInt(fg.slice(1), 16)
  const b = Number.parseInt(bg.slice(1), 16)
  const mix = (fc: number, bc: number): number => Math.round(alpha * fc + (1 - alpha) * bc)
  const r = mix((f >> 16) & 0xff, (b >> 16) & 0xff)
  const g = mix((f >> 8) & 0xff, (b >> 8) & 0xff)
  const bl = mix(f & 0xff, b & 0xff)
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`
}

const css = readFileSync('app/globals.css', 'utf8')

const themes = [
  { name: 'tema claro', tokens: blockTokens(css, ':root') },
  { name: 'tema oscuro', tokens: blockTokens(css, '.dark') },
]

const REQUIRED_TOKENS = [
  'body',
  'muted-foreground',
  'faint',
  'card',
  'popover',
  'background',
  'muted',
  'primary-foreground',
] as const

interface Case {
  theme: string
  text: string
  surface: string
  ratio: number
}

function roundedRatio(a: string, b: string): number {
  return Math.round(contrast(a, b) * 100) / 100
}

function contrastCases(tokens: Tokens, theme: string): Case[] {
  const surfaces: Array<[string, string]> = [
    ['card', tokens.card],
    ['popover', tokens.popover],
    ['background', tokens.background],
    ['muted (hover de chips)', tokens.muted],
    ['celda de hoy (muted/60 sobre card)', alphaOver(tokens.muted, 0.6, tokens.card)],
  ]
  const textTokens: Array<[string, string]> = [
    ['body', tokens.body],
    ['muted-foreground', tokens['muted-foreground']],
    ['faint', tokens.faint],
  ]
  const cases = textTokens.flatMap(([text, textColor]) =>
    surfaces.map(([surface, surfaceColor]) => ({
      theme,
      text: `--${text}`,
      surface,
      ratio: roundedRatio(textColor, surfaceColor),
    })),
  )
  cases.push({
    theme,
    text: '--primary-foreground (texto de ausencia)',
    surface: '--faint (fondo del evento)',
    ratio: roundedRatio(tokens['primary-foreground'], tokens.faint),
  })
  return cases
}

const cases: Case[] = themes.flatMap((theme) => contrastCases(theme.tokens, theme.name))

describe('guardia de contraste WCAG 1.4.3 (appointments-2026-11-07-002)', () => {
  it.each(themes)('$name define todos los tokens de la guardia en globals.css', ({ tokens }) => {
    for (const token of REQUIRED_TOKENS) {
      expect(tokens[token], `--${token} falta o no es un hex de 6 dígitos`).toMatch(
        /^#[0-9a-f]{6}$/,
      )
    }
  })

  it.each(cases)('$theme: $text sobre $surface >= 4,5:1 (ratio $ratio)', ({ ratio }) => {
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })
})
