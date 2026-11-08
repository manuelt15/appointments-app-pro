import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * Guardia de semántica ARIA de las rejillas de días de los pickers —
 * appointments-2026-11-07-006 (MEDIA, accesibilidad).
 *
 * El hallazgo: el contenedor de días declaraba role="grid" y sus hijos
 * directos eran spans role="columnheader" y buttons role="gridcell", sin
 * ningún role="row" intermedio. Jerarquía grid > row > gridcell rota, sin
 * foco por flechas ni roving tabindex: un patrón grid INCOMPLETO e inválido,
 * y encima tapaba el rol nativo (el lector anunciaba «gridcell» en vez de
 * «botón»).
 *
 * Resolución mínima y válida (APG): el patrón grid exige filas Y navegación
 * con flechas/roving tabindex. En lugar de fingir medio grid, se retira el
 * rol grid y cada día queda lo que ya era de verdad: un <button type="button">
 * nativo con la fecha completa como nombre accesible, agrupados en un
 * role="group" etiquetado. La selección se expresa con aria-pressed (válido
 * sobre button, a diferencia de aria-selected) — el mismo recurso que usa
 * react-day-picker para sus días.
 *
 * Se vigila SOLO la región de días de cada picker. El listbox de horas del
 * DateTimePicker (hallazgo -007) queda fuera de la región a propósito.
 *
 * Este guard se pone en rojo si la rejilla de días vuelve a declarar un grid
 * sin filas/flechas, si pierde el role="group", si los días dejan de ser
 * botones nativos con fecha completa, o si la selección vuelve a exponerse
 * con aria-selected (prohibido sobre button).
 */

interface Check {
  file: string
  reason: string
  pattern: RegExp
  times: number
}

const DAYS_REGION_START = 'grid grid-cols-7'
const DAYS_REGION_END = 'role="listbox"'

const cache = new Map<string, string>()

/** Zona de la rejilla de días: desde el contenedor grid-cols-7 hasta el
 *  listbox de horas (si existe). Lo que haya después (hallazgo -007) no se
 *  vigila aquí. */
function daysRegion(file: string): string {
  let content = cache.get(file)
  if (content === undefined) {
    content = readFileSync(file, 'utf8')
    cache.set(file, content)
  }
  const start = content.indexOf(DAYS_REGION_START)
  if (start === -1) throw new Error(`${file}: no se encuentra la rejilla de días`)
  const end = content.indexOf(DAYS_REGION_END, start)
  return content.slice(start, end === -1 ? undefined : end)
}

const CHECKS: Check[] = [
  // Lo que NO debe estar (el patrón grid inválido del hallazgo)
  {
    file: 'components/ui/date-picker.tsx',
    reason: 'sin role="grid": sin filas ni flechas es un patrón grid incompleto',
    pattern: /role="grid"/g,
    times: 0,
  },
  {
    file: 'components/ui/date-picker.tsx',
    reason: 'sin role="gridcell": el día es un botón y el lector debe anunciar «botón»',
    pattern: /role="gridcell"/g,
    times: 0,
  },
  {
    file: 'components/ui/date-picker.tsx',
    reason: 'sin role="columnheader" fuera de un grid',
    pattern: /role="columnheader"/g,
    times: 0,
  },
  {
    file: 'components/ui/date-picker.tsx',
    reason: 'sin aria-selected sobre los días: prohibido sobre button',
    pattern: /aria-selected/g,
    times: 0,
  },
  {
    file: 'components/ui/date-time-picker.tsx',
    reason: 'sin role="grid": sin filas ni flechas es un patrón grid incompleto',
    pattern: /role="grid"/g,
    times: 0,
  },
  {
    file: 'components/ui/date-time-picker.tsx',
    reason: 'sin role="gridcell": el día es un botón y el lector debe anunciar «botón»',
    pattern: /role="gridcell"/g,
    times: 0,
  },
  {
    file: 'components/ui/date-time-picker.tsx',
    reason: 'sin role="columnheader" fuera de un grid',
    pattern: /role="columnheader"/g,
    times: 0,
  },
  {
    file: 'components/ui/date-time-picker.tsx',
    reason: 'la región de días no expone la selección con aria-selected (prohibido sobre button)',
    pattern: /aria-selected/g,
    times: 0,
  },

  // Lo que SÍ debe estar (el patrón válido que lo sustituye)
  {
    file: 'components/ui/date-picker.tsx',
    reason: 'la rejilla de días es un grupo etiquetado',
    pattern: /role="group" aria-label="Days"/g,
    times: 1,
  },
  {
    file: 'components/ui/date-picker.tsx',
    reason: 'cada día sigue siendo un <button type="button"> nativo con la fecha completa como nombre accesible',
    pattern: /<button\b[\s\S]{0,120}?type="button"[\s\S]{0,200}?aria-label=\{format\(day, 'd MMMM yyyy'\)\}/g,
    times: 1,
  },
  {
    file: 'components/ui/date-picker.tsx',
    reason: 'la selección del día se expresa con aria-pressed (válido sobre button)',
    pattern: /aria-pressed=\{isSelected\}/g,
    times: 1,
  },
  {
    file: 'components/ui/date-picker.tsx',
    reason: 'la interacción no cambia: el día se elige con su onClick pick(day)',
    pattern: /onClick=\{\(\) => pick\(day\)\}/g,
    times: 1,
  },
  {
    file: 'components/ui/date-time-picker.tsx',
    reason: 'la rejilla de días es un grupo etiquetado',
    pattern: /role="group" aria-label="Days"/g,
    times: 1,
  },
  {
    file: 'components/ui/date-time-picker.tsx',
    reason: 'cada día sigue siendo un <button type="button"> nativo con la fecha completa como nombre accesible',
    pattern: /<button\b[\s\S]{0,120}?type="button"[\s\S]{0,200}?aria-label=\{format\(day, 'd MMMM yyyy'\)\}/g,
    times: 1,
  },
  {
    file: 'components/ui/date-time-picker.tsx',
    reason: 'la selección del día se expresa con aria-pressed (válido sobre button)',
    pattern: /aria-pressed=\{isSelected\}/g,
    times: 1,
  },
  {
    file: 'components/ui/date-time-picker.tsx',
    reason: 'la interacción no cambia: el día se elige con su onClick pickDay(day)',
    pattern: /onClick=\{\(\) => pickDay\(day\)\}/g,
    times: 1,
  },
]

describe('guardia de roles ARIA de las rejillas de días de los pickers (appointments-2026-11-07-006)', () => {
  it.each(CHECKS)('$file — $reason', (check) => {
    const region = daysRegion(check.file)
    const matches = region.match(check.pattern)
    expect(
      matches?.length ?? 0,
      `${check.file}: el patrón debe aparecer ${check.times} vez/veces en la región de días`,
    ).toBe(check.times)
  })
})
