# Handover 2026-11-08: texto legible sobre el color del empleado

## Qué se hizo
- **Hallazgo `appointments-2026-11-07-004` (MEDIA, accesibilidad, WCAG 1.4.3):**
  los chips de turno fijaban `text-primary-foreground` (blanco en claro,
  casi negro en oscuro) sobre el color del empleado, y la vista de mes hacía
  lo mismo en `eventPropGetter`.
- **Antes (ratios reales del guardián):** claro `#ffffff` sobre `#f5a623` →
  2,03:1, `#14b8a6` → 2,49, `#10b981` → 2,54, `#ff0080` → 3,77, `#6366f1` →
  4,47; oscuro `#0a0a0a` sobre `#7928ca` → 2,80, `#0070f3` → 4,35, `#6366f1`
  → 4,43, `#ee0000` → 4,37. Las notas del chip (`opacity-90`) caían a 1,89–3,98
  en claro, y el hover (`can-hover:hover:opacity-90`) a 1,89–4,44 sobre las
  celdas de card, fin de semana y cumpleaños.
- **Fix, 3 toques:** helper nuevo `lib/design/readable-foreground.ts`
  (`readableForeground`): devuelve `#000000` o `#ffffff` puro, el de mayor
  contraste — para cualquier fondo el mejor de los dos garantiza ≥ 4,58:1 y,
  siendo literales, vale en ambos temas (tintas suaves no sirven: `#171717`
  sobre el azul `#0070f3` de la paleta se queda en 3,93:1). Fondos que no son
  hex (`--faint` de las ausencias, `--foreground` del fallback) mantienen
  `--primary-foreground`, el par que ya vigilaba el guardián del -002. Lo usan
  WeekMatrix (color inline del chip) y ShiftCalendar (`eventPropGetter`).
- **Notas y hover:** las notas pierden `opacity-90` (jerarquía solo por peso)
  y el hover pasa de `opacity-90` a un ring
  (`transition-shadow can-hover:hover:ring-2 can-hover:hover:ring-ring/60`):
  con la paleta actual (azul y rojo rozan el límite 4,61:1/4,63:1 en reposo),
  cualquier alfa sobre el chip rompe AA; el ring no toca el par texto/fondo.
- **Guard numérico `lib/design/employee-chip-contrast.test.ts`:** 102 casos.
  Lee la paleta de `EmployeeForm`, los tokens de `globals.css` y las clases
  reales que pintan WeekMatrix y ShiftCalendar, y recalcula la fórmula WCAG
  (reposo, notas con su alfa, hover compuesto sobre las tres celdas y vista de
  mes, en ambos temas). Si alguien vuelve a fijar `--primary-foreground` o
  reintroduce una opacidad en notas/hover, se pone en rojo.
- `DESIGN.md` (Calendario) documenta la regla y enlaza el guardián.

## Cómo se verificó
- RED antes del cambio (solo con helper+guard creados): 65/102 fallan con los
  ratios del hallazgo (2,03 · 2,49 · 2,54 · 2,80 · 3,77…). GREEN después:
  102/102; el más justo 4,61:1 (texto negro sobre `#0070f3`) y el resto
  hasta 10,36:1.
- `npm test`: 275/275 en 20 ficheros (173 previos + 102 del guardián).
- `npx tsc --noEmit`: sin errores. `npm run lint`: solo el warning previo de
  `lib/schedule/email.ts:76`. `npm run build`: exit 0 con las mismas rutas y
  `.next/BUILD_ID` posterior a los ficheros tocados.
- Sin preview ni BD real: verificación de cadena técnica y prueba numérica;
  la verificación visual es de Manuel.

## No tocado
- Otros hallazgos del registro; el registro en sí (el padre hace la
  transición); los puntos decorativos de color (fila de la matriz, PDF y
  emails, que no ponen texto encima); el `ColorPicker` del formulario
  (el check sobre el swatch es otro asunto, no citado en el hallazgo);
  `.rbc-event` de la vista de mes, que no aplica hover propio.
