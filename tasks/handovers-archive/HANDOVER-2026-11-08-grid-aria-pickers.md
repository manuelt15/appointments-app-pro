# Handover 2026-11-08: grids ARIA inválidas de los pickers de fecha

## Qué se hizo
- **Hallazgo `appointments-2026-11-07-006` (MEDIA, accesibilidad):** el contenedor de
  días de `DatePicker` y `DateTimePicker` declaraba `role="grid"` con hijos directos
  `role="columnheader"` y `role="gridcell"` — sin ningún `role="row"` — y sin flechas ni
  roving tabindex: jerarquía rota, patrón grid incompleto, y el lector anunciaba
  «gridcell» en vez de «botón».
- **Solución:** mínima y semántica válida, en `components/ui/date-picker.tsx` (152-175)
  y `components/ui/date-time-picker.tsx` (138-166):
  - El contenedor pasa de `role="grid"` a `role="group" aria-label="Days"`.
  - Las cabeceras de día dejan de fingir `columnheader` (span plano).
  - Los días dejan de llevar `role="gridcell"` (que tapaba su rol nativo) y exponen
    la selección con `aria-pressed` — válido sobre `button`, a diferencia de
    `aria-selected`, que está prohibido — el mismo recurso de react-day-picker.
  - La interacción NO cambia: mismos `<button type="button">`, mismos
    `onClick={() => pick(day)}` / `pickDay(day)`, mismas clases y fechas completas
    en `aria-label`. Tab + Enter/Space sigue operando todo.
- **Guard:** `components/ui/picker-day-grid-aria.test.ts` (16 checks estáticos sobre
  la región de días de cada picker, estilo `keyboard-move.test.ts`). Se vigila SOLO la
  región de días: el listbox de horas (hallazgo **-007**) queda fuera a propósito,
  para no bloquear su arreglo futuro.

## Cómo se verificó
- **RED primero:** el guard en solitario sobre HEAD falló **12/16** por el patrón
  inválido presente y el válido ausente (grid/gridcell/columnheader/aria-selected a 1
  en vez de 0; `role="group" aria-label="Days"` y `aria-pressed` a 0 en vez de 1).
- **GREEN:** guard 16/16 y el guard vecino `keyboard-move.test.ts` 25/25 intacto.
- **Serie completa:** `npx tsc --noEmit` exit 0 · `npm run lint` 0 errores (solo el
  warning previo de `lib/schedule/email.ts:76`, ajeno) · `npm test` **303/303 en 25
  ficheros** (287 previos + 16 nuevos) · `npm run build` exit 0, "Compiled
  successfully in 15.1s", `.next/BUILD_ID` (12:05:32) posterior a las fuentes.
- Trampa pisada: un `npm run build | grep -m1` mató el build con SIGPIPE tras
  "Compiled" y dejó `.next` sin BUILD_ID; rehecho con salida a fichero y exit code
  real. No usar pipes de una línea para juzgar builds.

## No tocado
- `components/calendar/WeekPicker.tsx:126-150` tiene el MISMO patrón grid inválido,
  pero NO está en la evidencia del -006 (solo cita los dos pickers): se deja para el
  padre, que decide si abre hallazgo.
- El listbox de horas del DateTimePicker (hallazgo -007), el resto de hallazgos
  abiertos y el registro de hallazgos (transición del -006 a arreglado: el padre).
- Cero cambios de comportamiento, estilos o dependencias.
