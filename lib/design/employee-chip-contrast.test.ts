import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import { readableForeground } from './readable-foreground'

/**
 * Guardia de contraste WCAG 1.4.3 — appointments-2026-11-07-004.
 *
 * Los chips de turno se pintan con el color del empleado de fondo y el
 * texto debe superar 4,5:1 en ambos temas:
 *
 *  - reposo: texto del chip sobre el color del empleado, en la WeekMatrix
 *    y en la vista de mes (`eventPropGetter` de ShiftCalendar).
 *  - notas: segunda línea del chip, con la opacidad que tenga puesta.
 *  - hover: chip translúcido (si usa `opacity`) compuesto sobre cada celda
 *    donde vive: card, fin de semana (`bg-muted/40`) y cumpleaños
 *    (`bg-birthday/15`).
 *
 * El guardián recalcula la fórmula WCAG 2.x leyendo la paleta de
 * EmployeeForm, los tokens de globals.css y las clases que pinta cada
 * componente, así que mide el par real que ve el usuario. Si alguien fija
 * otra vez el texto con `--primary-foreground` o devuelve a las notas o al
 * hover una opacidad que rompa AA, esto se pone en rojo.
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

function roundedRatio(a: string, b: string): number {
  return Math.round(contrast(a, b) * 100) / 100
}

const css = readFileSync('app/globals.css', 'utf8')

const themes = [
  { name: 'tema claro', tokens: blockTokens(css, ':root') },
  { name: 'tema oscuro', tokens: blockTokens(css, '.dark') },
]

const REQUIRED_TOKENS = ['primary-foreground', 'card', 'muted', 'birthday'] as const

const employeeForm = readFileSync('components/employees/EmployeeForm.tsx', 'utf8')
const palette =
  /EMPLOYEE_COLORS = \[([^\]]+)\]/
    .exec(employeeForm)?.[1]
    .split(',')
    .map((color) => color.trim().replace(/['"]/g, '').toLowerCase()) ?? []

const weekMatrix = readFileSync('components/calendar/WeekMatrix.tsx', 'utf8')
const shiftCalendar = readFileSync('components/calendar/ShiftCalendar.tsx', 'utf8')

// Chip de la WeekMatrix: el botón del turno (su `key` lo distingue del punto
// decorativo de la fila, que también lleva backgroundColor del empleado).
const chipClass =
  /key=\{item\.shift\._id\}[\s\S]{0,400}?className="([^"]*)"\s*style=\{\{ backgroundColor: employee\.color/.exec(
    weekMatrix,
  )?.[1] ?? ''
const chipUsesToken = /text-primary-foreground/.test(chipClass)
const hoverAlpha = Number(/can-hover:hover:opacity-(\d+)/.exec(chipClass)?.[1] ?? 100) / 100

// Notas del chip: segunda línea que hereda el color del texto.
const notesClass = /shift\.notes && <span className="([^"]*)">/.exec(weekMatrix)?.[1] ?? ''
const notesAlpha = Number(/opacity-(\d+)/.exec(notesClass)?.[1] ?? 100) / 100

// Vista de mes: color de texto del eventPropGetter.
const monthUsesToken = /color: 'var\(--primary-foreground\)'/.test(shiftCalendar)

function chipText(color: string, tokens: Tokens): string {
  return chipUsesToken ? tokens['primary-foreground'] : readableForeground(color)
}

function monthText(color: string, tokens: Tokens): string {
  return monthUsesToken ? tokens['primary-foreground'] : readableForeground(color)
}

function cellSurfaces(tokens: Tokens): Array<[string, string]> {
  return [
    ['card', tokens.card],
    ['fin de semana (muted/40 sobre card)', alphaOver(tokens.muted, 0.4, tokens.card)],
    ['cumpleaños (birthday/15 sobre card)', alphaOver(tokens.birthday, 0.15, tokens.card)],
  ]
}

interface Case {
  theme: string
  text: string
  surface: string
  ratio: number
  label: string
}

function chipCases(color: string, theme: string, tokens: Tokens): Case[] {
  const text = chipText(color, tokens)
  const cases: Case[] = [
    {
      theme,
      text,
      surface: color,
      label: 'reposo',
      ratio: roundedRatio(text, color),
    },
    {
      theme,
      text: alphaOver(text, notesAlpha, color),
      surface: color,
      label: 'notas',
      ratio: roundedRatio(alphaOver(text, notesAlpha, color), color),
    },
  ]
  for (const [name, surface] of cellSurfaces(tokens)) {
    cases.push({
      theme,
      text: alphaOver(text, hoverAlpha, surface),
      surface: `hover sobre ${name}`,
      label: 'hover',
      ratio: roundedRatio(alphaOver(text, hoverAlpha, surface), alphaOver(color, hoverAlpha, surface)),
    })
  }
  const month = monthText(color, tokens)
  cases.push({
    theme,
    text: month,
    surface: color,
    label: 'vista de mes',
    ratio: roundedRatio(month, color),
  })
  return cases
}

const cases: Case[] = themes.flatMap((theme) =>
  palette.flatMap((color) => chipCases(color, theme.name, theme.tokens)),
)

describe('guardia de contraste WCAG 1.4.3 (appointments-2026-11-07-004)', () => {
  it.each(themes)('$name define todos los tokens de la guardia en globals.css', ({ tokens }) => {
    for (const token of REQUIRED_TOKENS) {
      expect(tokens[token], `--${token} falta o no es un hex de 6 dígitos`).toMatch(
        /^#[0-9a-f]{6}$/,
      )
    }
  })

  it('la paleta y las clases se leen del fuente', () => {
    expect(palette.length, 'no se encontró EMPLOYEE_COLORS en EmployeeForm').toBeGreaterThanOrEqual(8)
    for (const color of palette) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/)
    }
    expect(chipClass, 'no se encontró el chip de turno en WeekMatrix').toMatch(/w-full rounded-sm/)
    expect(notesClass, 'no se encontró la línea de notas del chip').toBeTruthy()
  })

  it.each(cases)(
    '$label [$theme] $text sobre $surface >= 4,5:1 (ratio $ratio)',
    ({ ratio }) => {
      expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    },
  )
})

describe('readableForeground (appointments-2026-11-07-004)', () => {
  it('devuelve negro o blanco puro según el mayor contraste', () => {
    expect(readableForeground('#f5a623')).toBe('#000000')
    expect(readableForeground('#7928ca')).toBe('#ffffff')
    expect(readableForeground('#000000')).toBe('#ffffff')
  })

  it('acepta hex de 3 dígitos y mayúsculas, y recorta espacios', () => {
    expect(readableForeground('#FA0')).toBe(readableForeground('#ffaa00'))
    expect(readableForeground(' #000 ')).toBe('#ffffff')
  })

  it('mantiene el token actual cuando el fondo no es un hex', () => {
    expect(readableForeground('var(--faint)')).toBe('var(--primary-foreground)')
    expect(readableForeground('var(--foreground)')).toBe('var(--primary-foreground)')
  })
})
