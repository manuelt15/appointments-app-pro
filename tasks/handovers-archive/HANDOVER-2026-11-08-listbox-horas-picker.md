# Handover 2026-11-08: listbox de horas del DateTimePicker

## Qué se hizo
- **Hallazgo `appointments-2026-11-07-007` (MEDIA, accesibilidad):** la lista de horas de
  `components/ui/date-time-picker.tsx` declaraba `role="listbox"` con 48 hijos
  `<button role="option" aria-selected>`: sin `aria-activedescendant`, sin roving tabindex
  y sin flechas. Patrón listbox incompleto (el APG exige su gestión de foco) y además
  tapaba el rol nativo: el lector anunciaba «opción» dentro de una lista que no se
  navega como tal, con 48 paradas de tabulación.
- **Solución:** mínima y semántica válida, la misma vía que el -006 usó para los días:
  - El contenedor pasa de `role="listbox"` a `role="group" aria-label="Time"`.
  - Las horas dejan de fingir `role="option"` y exponen la selección con `aria-pressed`
    (válido sobre `button`, a diferencia de `aria-selected`, prohibido).
  - `data-selected` se conserva: es interno y alimenta el scroll a la hora elegida al
    abrir el popover (`querySelector('[data-selected="true"]')` en el efecto de apertura).
  - La interacción NO cambia: mismos `<button type="button">`, mismos
    `onClick={() => pickTime(...)}`, mismas clases. Tab + Enter/Space sigue operando todo.
- **Guard:** `components/ui/time-list-aria.test.ts` (7 checks estáticos sobre la región
  de horas, estilo `picker-day-grid-aria.test.ts`).
- **Guard vecino del -006:** su región de días terminaba en el ancla `role="listbox"`,
  que este arreglo elimina. El ancla pasa a `aria-label="Time"` (el contenedor de horas,
  que sobrevive al fix). Sus 16 checks no cambian: antes y después delimitan la misma
  región de días.

## Cómo se verificó
- **RED primero:** el guard en solitario sobre el código roto falló **5/7**
  (listbox/option/aria-selected a 1 en vez de 0; `role="group" aria-label="Time"` y
  `aria-pressed` a 0 en vez de 1). Los 2 que ya pasaban son invariantes que la
  interacción conservaba: botón nativo con `pickTime` y `data-selected`.
- **GREEN:** guard -007 7/7 y guard -006 16/16 intacto (23/23 juntos).
- **Serie completa:** `npx tsc --noEmit` exit 0 · `npm run lint` 0 errores (solo el
  warning previo de `lib/schedule/email.ts:76`, ajeno) · `npm test` **310/310 en 26
  ficheros** (303 previos + 7 nuevos) · `npm run build` exit 0, "Compiled successfully
  in 18.7s", `.next/BUILD_ID` (12:09:53) posterior a las fuentes (12:08:22).
- `procesos-abiertos.py`: limpio. Sin preview ni servidores arrancados en la sesión.

## No tocado
- La rejilla de días (-006) y el resto de hallazgos abiertos: cero cambios. Del guard
  del -006 solo se actualizó el ANCLA de región, no sus checks.
- El registro de hallazgos (transición del -007 a arreglado: el padre).
- `WeekPicker.tsx` (mismo patrón grid inválido, fuera de la evidencia del -006) queda
  como estaba. Cero cambios de comportamiento, estilos o dependencias.
