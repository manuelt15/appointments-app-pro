import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * Guardia de semántica ARIA de la lista de horas del DateTimePicker —
 * appointments-2026-11-07-007 (MEDIA, accesibilidad).
 *
 * El hallazgo: el contenedor de horas declaraba role="listbox" y sus 48
 * hijos eran <button role="option" aria-selected>. El patrón listbox del
 * APG exige aria-activedescendant o roving tabindex con navegación por
 * flechas; aquí no hay ni lo uno ni lo otro y las 48 opciones son
 * tabulables una a una. Patrón listbox INCOMPLETO: el lector anuncia
 * «opción» dentro de una lista que no se navega como tal.
 *
 * Resolución mínima y válida (la misma del hallazgo -006 para los días):
 * en lugar de fingir medio listbox, se retira el rol y cada hora queda
 * lo que ya era de verdad: un <button type="button"> nativo con su hora
 * como nombre accesible, dentro de un role="group" etiquetado. La
 * selección se expresa con aria-pressed (válido sobre button, a
 * diferencia de aria-selected). data-selected se conserva: es interno
 * y alimenta el scroll a la hora elegida al abrir el popover.
 *
 * Se vigila SOLO la región de horas del DateTimePicker (desde su
 * contenedor con timeListRef hasta el final del fichero). Los días
 * (hallazgo -006) tienen su propio guard en picker-day-grid-aria.test.ts.
 *
 * Este guard se pone en rojo si la lista de horas vuelve a declarar un
 * listbox sin aria-activedescendant/flechas, si las horas dejan de ser
 * botones nativos, si pierde el role="group" etiquetado, si la selección
 * vuelve a exponerse con aria-selected (prohibido sobre button) o si se
 * rompe el scroll al abrir (data-selected).
 */

interface Check {
  file: string
  reason: string
  pattern: RegExp
  times: number
}

const HOURS_REGION_START = 'ref={timeListRef}'

const cache = new Map<string, string>()

/** Zona de la lista de horas: desde su contenedor con timeListRef hasta el
 *  final del fichero (es el último bloque del picker). Los días que hay
 *  antes no se vigilan aquí: tienen su propio guard (-006). */
function hoursRegion(file: string): string {
  let content = cache.get(file)
  if (content === undefined) {
    content = readFileSync(file, 'utf8')
    cache.set(file, content)
  }
  const start = content.indexOf(HOURS_REGION_START)
  if (start === -1) throw new Error(`${file}: no se encuentra la lista de horas`)
  return content.slice(start)
}

const FILE = 'components/ui/date-time-picker.tsx'

const CHECKS: Check[] = [
  // Lo que NO debe estar (el patrón listbox inválido del hallazgo)
  {
    file: FILE,
    reason: 'sin role="listbox": sin aria-activedescendant ni flechas es un patrón listbox incompleto',
    pattern: /role="listbox"/g,
    times: 0,
  },
  {
    file: FILE,
    reason: 'sin role="option": tapa el rol nativo y el lector anuncia «opción» sin lista real que navegar',
    pattern: /role="option"/g,
    times: 0,
  },
  {
    file: FILE,
    reason: 'sin aria-selected en las horas: prohibido sobre button',
    pattern: /aria-selected/g,
    times: 0,
  },

  // Lo que SÍ debe estar (el patrón válido que lo sustituye)
  {
    file: FILE,
    reason: 'la lista de horas es un grupo etiquetado',
    pattern: /role="group"\s+aria-label="Time"/g,
    times: 1,
  },
  {
    file: FILE,
    reason: 'cada hora sigue siendo un <button type="button"> nativo y se elige con su onClick pickTime(...)',
    pattern: /<button\b[\s\S]{0,120}?type="button"[\s\S]{0,200}?onClick=\{\(\) => pickTime\(slot\.hours, slot\.minutes\)\}/g,
    times: 1,
  },
  {
    file: FILE,
    reason: 'la hora seleccionada se expone con aria-pressed (válido sobre button)',
    pattern: /aria-pressed=\{isSelected\}/g,
    times: 1,
  },
  {
    file: FILE,
    reason: 'data-selected sigue presente: alimenta el scroll a la hora elegida al abrir el popover',
    pattern: /data-selected=\{isSelected\}/g,
    times: 1,
  },
]

describe('guardia de roles ARIA de la lista de horas del DateTimePicker (appointments-2026-11-07-007)', () => {
  it.each(CHECKS)('$file — $reason', (check) => {
    const region = hoursRegion(check.file)
    const matches = region.match(check.pattern)
    expect(
      matches?.length ?? 0,
      `${check.file}: el patrón debe aparecer ${check.times} vez/veces en la región de horas`,
    ).toBe(check.times)
  })
})
