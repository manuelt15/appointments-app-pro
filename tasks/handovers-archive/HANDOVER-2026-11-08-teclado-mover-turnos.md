# Handover 2026-11-08: mover/redimensionar turnos con teclado (falso positivo)

## Qué se hizo
- **Hallazgo `appointments-2026-11-07-003` (MEDIA, accesibilidad, WCAG 2.1.1):** afirmaba que
  mover/redimensionar turnos «solo es posible con ratón» porque el arrastre de la vista
  mensual (`withDragAndDrop`, `onEventDrop`/`onEventResize` en `ShiftCalendar.tsx:347-348`)
  no tiene teclado, y concluía que la función no era accesible «en ninguna vista».
- **Veredicto: FALSO POSITIVO.** WCAG 2.1.1 exige que la *función* sea operable por teclado,
  no que cada gesto lo sea; el arrastre está permitido cuando el mismo resultado se logra
  por teclado por otra vía. Esa vía es el flujo principal de la app:
  - `ShiftCalendar.tsx:64` — la vista por defecto es la SEMANAL.
  - `WeekMatrix.tsx:150-153` — cada turno es un `<button type="button">`: tabular + Enter
    (ausencias en `:134-137`, celda vacía "add" en `:168-175`).
  - `ShiftCalendar.tsx:331` — `onSelectShift={(shift) => setModal({ shift })}` abre el modal
    en modo EDICIÓN con el turno real.
  - `ShiftModal.tsx:58-63` precarga las horas del turno; `:214-219` expone «Start»/«End»
    con `DateTimePicker`; `:125-130` guarda con `PUT /api/shifts/${shift._id}` y
    `startTime`/`endTime` (`:122-123`) — el mismo endpoint y payload que `handleEventDrop`
    (`ShiftCalendar.tsx:154-163`). Cambiar Start = mover, cambiar End = redimensionar.
  - `date-time-picker.tsx:101-112` (disparador), `:148-163` (días) y `:180-193` (horas)
    son botones nativos; `ShiftCalendar.tsx:278-291` — el conmutador mes/semana también,
    con lo que desde la vista mensual se llega a la semanal sin ratón.
- **Matiz documentado:** en la vista MENSUAL los eventos de react-big-calendar son
  `<div class="rbc-event">` sin `tabIndex` ni `role` (`node_modules/react-big-calendar/lib/
  EventCell.js:70-87`), así que el modal no se abre con teclado *desde* el mes. La función
  queda cubierta igualmente por la vista semanal (por defecto) + conmutador accesible.
- **Entrega:** guard `components/calendar/keyboard-move.test.ts` (25 checks estáticos que
  bloquean cada eslabón de la cadena de teclado). **Cero cambios en código de la app.**
  Commit `ca5c853`.

## Cómo se verificó
- Guard en solitario: 25/25. `npm test`: **173/173 en 19 ficheros** (148 previos + 25 nuevos).
- `npx tsc --noEmit`: sin errores. `npm run lint`: 0 errores (solo el warning previo de
  `lib/schedule/email.ts:76`, ajeno a este cambio). `npm run build`: exit 0 (Turbopack,
  "Compiled successfully in 21.8s", 21 páginas; `.env.local` dummy) y `.next/BUILD_ID`
  posterior al guard.
- **Demo de que el guard muerde (RED) sin tocar el repo** (`guard-demo.mjs` en el scratch
  del perfil): sobre copias en memoria, (1) quitar `type="button"` del botón de turno,
  (2) romper `setModal({ shift })`, (3) poner la vista por defecto en MONTH → los tres
  checks caen a 0. Fuentes reales intactos (sha256 verificado tras la demo).

## No tocado
- Código de la app (ni `ShiftCalendar`, ni `ShiftModal`, ni `WeekMatrix`, ni el picker).
- El registro de hallazgos y cualquier otro hallazgo: la transición del -003 a falso
  positivo la hace el padre. Los hallazgos -005/-006 sobre roles del picker (grid sin
  row, listbox sin `aria-activedescendant`) SIGUEN siendo hallazgos reales de semántica
  para lector de pantalla; son otro asunto distinto de la operabilidad por teclado.
