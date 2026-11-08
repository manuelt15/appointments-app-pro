import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * Guardia de vía de teclado para mover y redimensionar turnos —
 * appointments-2026-11-07-003 (verificado como FALSO POSITIVO).
 *
 * El hallazgo afirmaba que mover/redimensionar turnos «solo es posible con
 * ratón» porque el arrastre de la vista mensual (withDragAndDrop,
 * onEventDrop/onEventResize) no tiene teclado, y concluía que la función no
 * era accesible «en ninguna vista».
 *
 * WCAG 2.1.1 exige que la FUNCIÓN sea operable por teclado, no que cada gesto
 * lo sea: un arrastre queda permitido cuando el mismo resultado se logra por
 * teclado por otra vía (Understanding WCAG 2.1.1). Esa vía existe y es el
 * flujo principal de la aplicación:
 *
 *  1. La vista por defecto es la SEMANAL (WeekMatrix), donde cada turno y
 *     cada celda vacía son <button> nativos: tabular + Enter.
 *  2. Enter sobre un turno abre el ShiftModal en modo EDICIÓN con el turno
 *     real (setModal({ shift })), que precarga sus horas.
 *  3. El modal edita «Start» y «End» con el DateTimePicker, cuyos controles
 *     (disparador, días, horas) son botones nativos, y guarda con el mismo
 *     PUT /api/shifts/[id] + startTime/endTime que usa handleEventDrop al
 *     arrastrar: cambiar Start es mover, cambiar End es redimensionar.
 *  4. El conmutador mes/semana también es un botón nativo, así que un usuario
 *     de teclado en la vista mensual —donde react-big-calendar pinta los
 *     eventos como <div> sin tabIndex (EventCell) y el modal no se abre con
 *     teclado desde ahí— puede cambiar a la semanal y editar igual.
 *
 * Este guardia se pone en rojo si se rompe cualquier eslabón: botones de la
 * matriz, apertura del modal en modo edición, campos Start/End, botones del
 * picker o la equivalencia de payload entre modal y arrastre.
 */

interface Check {
  file: string
  reason: string
  pattern: RegExp
  times: number
}

const CHECKS: Check[] = [
  // ShiftCalendar: vista por defecto y apertura del modal en modo edición
  {
    file: 'components/calendar/ShiftCalendar.tsx',
    reason: 'la vista por defecto es la semanal, la que sí es operable por teclado',
    pattern: /useState<View>\(Views\.WEEK\)/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftCalendar.tsx',
    reason: 'pulsar un turno abre el modal en modo edición con el turno real (PUT), no solo en modo creación',
    pattern: /onSelectShift=\{\(shift\) => setModal\(\{ shift \}\)\}/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftCalendar.tsx',
    reason: 'el conmutador mes/semana son botones nativos: desde la vista mensual se llega a la semanal sin ratón',
    pattern: /onClick=\{\(\) => setView\(option\)\}/g,
    times: 1,
  },

  // Equivalencia de payload: el arrastre es la referencia
  {
    file: 'components/calendar/ShiftCalendar.tsx',
    reason: 'el arrastre existe como atajo de ratón (drop y resize); se verifica que la MISMA función tenga vía de teclado',
    pattern: /onEvent(Drop|Resize)=\{handleEventDrop\}/g,
    times: 2,
  },
  {
    file: 'components/calendar/ShiftCalendar.tsx',
    reason: 'el arrastre hace PUT /api/shifts/[id], el mismo recurso que editará el modal',
    pattern: /fetch\(`\/api\/shifts\/\$\{event\.id\}`/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftCalendar.tsx',
    reason: 'el arrastre envía startTime convertido a ISO del negocio (mover)',
    pattern: /startTime: calendarDateToIso\(new Date\(start\), timeZone\)/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftCalendar.tsx',
    reason: 'el arrastre envía endTime (redimensionar = cambiar solo el final)',
    pattern: /endTime: calendarDateToIso\(new Date\(end\), timeZone\)/g,
    times: 1,
  },

  // WeekMatrix: turnos, ausencias y celdas vacías son botones nativos
  {
    file: 'components/calendar/WeekMatrix.tsx',
    reason: 'cada turno de trabajo es un <button type="button">: tabular + Enter lo abre',
    pattern: /<button\b[\s\S]{0,300}?type="button"[\s\S]{0,300}?onClick=\{\(\) => onSelectShift\(item\.shift\)\}/g,
    times: 1,
  },
  {
    file: 'components/calendar/WeekMatrix.tsx',
    reason: 'cada ausencia es un <button type="button">: tabular + Enter la abre',
    pattern: /<button\b[\s\S]{0,300}?type="button"[\s\S]{0,300}?onClick=\{\(\) => onSelectShift\(absence\.shift\)\}/g,
    times: 1,
  },
  {
    file: 'components/calendar/WeekMatrix.tsx',
    reason: 'cada celda vacía es un <button type="button">: crear un turno también es posible con teclado',
    pattern: /<button\b[\s\S]{0,300}?type="button"[\s\S]{0,300}?onClick=\{\(\) => onSelectCell\(employee\._id, day\)\}/g,
    times: 1,
  },

  // ShiftModal: edita Start/End del turno real y hace el mismo PUT
  {
    file: 'components/calendar/ShiftModal.tsx',
    reason: 'el modal precarga la hora de inicio del turno existente (modo edición)',
    pattern: /toBusinessDateTimeLocal\(shift\.startTime, timeZone\)/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftModal.tsx',
    reason: 'el modal precarga la hora de fin del turno existente (modo edición)',
    pattern: /toBusinessDateTimeLocal\(shift\.endTime, timeZone\)/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftModal.tsx',
    reason: 'el modal expone un campo «Start» editable',
    pattern: /label="Start"/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftModal.tsx',
    reason: 'el modal expone un campo «End» editable',
    pattern: /label="End"/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftModal.tsx',
    reason: 'el campo Start se alimenta del estado startTime',
    pattern: /value=\{startTime\} onChange=\{setStartTime\}/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftModal.tsx',
    reason: 'el campo End se alimenta del estado endTime',
    pattern: /value=\{endTime\} onChange=\{setEndTime\}/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftModal.tsx',
    reason: 'guardar un turno existente hace PUT al mismo recurso que el arrastre (la otra coincidencia de /api/shifts/ es el DELETE)',
    pattern: /const url = shift \? `\/api\/shifts\/\$\{shift\._id\}` : '\/api\/shifts'/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftModal.tsx',
    reason: 'en modo edición el modal usa el método PUT',
    pattern: /method: shift \? 'PUT' : 'POST'/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftModal.tsx',
    reason: 'el modal envía startTime en el PUT (mover con teclado)',
    pattern: /startTime: startTimeIso/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftModal.tsx',
    reason: 'el modal envía endTime en el PUT (redimensionar con teclado)',
    pattern: /endTime: endTimeIso/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftModal.tsx',
    reason: 'el modal es un Dialog de Radix: gestiona foco, Tab y Esc sin código propio',
    pattern: /@\/components\/ui\/dialog/g,
    times: 1,
  },
  {
    file: 'components/calendar/ShiftModal.tsx',
    reason: 'Start y End usan el DateTimePicker de botones nativos',
    pattern: /@\/components\/ui\/date-time-picker/g,
    times: 1,
  },

  // DateTimePicker: todos los controles son botones nativos
  {
    file: 'components/ui/date-time-picker.tsx',
    reason: 'disparador y cambio de mes son <Button type="button"> nativos (3 usos)',
    pattern: /<Button\b[\s\S]{0,120}?type="button"/g,
    times: 3,
  },
  {
    file: 'components/ui/date-time-picker.tsx',
    reason: 'cada día del calendario es un <button type="button"> nativo',
    pattern: /<button\b[\s\S]{0,200}?type="button"[\s\S]{0,200}?onClick=\{\(\) => pickDay\(day\)\}/g,
    times: 1,
  },
  {
    file: 'components/ui/date-time-picker.tsx',
    reason: 'cada hora de la lista es un <button type="button"> nativo',
    pattern: /<button\b[\s\S]{0,200}?type="button"[\s\S]{0,200}?onClick=\{\(\) => pickTime\(slot\.hours, slot\.minutes\)\}/g,
    times: 1,
  },
]

const cache = new Map<string, string>()

function sourceOf(file: string): string {
  let content = cache.get(file)
  if (content === undefined) {
    content = readFileSync(file, 'utf8')
    cache.set(file, content)
  }
  return content
}

describe('guardia de vía de teclado para mover/redimensionar turnos (appointments-2026-11-07-003)', () => {
  it.each(CHECKS)('$file — $reason', (check) => {
    const matches = sourceOf(check.file).match(check.pattern)
    expect(
      matches?.length ?? 0,
      `${check.file}: el patrón debe aparecer ${check.times} vez/veces y la vía de teclado quedaría rota si cambia`,
    ).toBe(check.times)
  })
})
