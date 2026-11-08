# Handover 2026-11-08: contraste AA de los tokens de texto secundario

## Qué se hizo
- **Hallazgo `appointments-2026-11-07-002` (MEDIA, accesibilidad, WCAG 1.4.3):** los
  tokens de texto secundario de `app/globals.css` no alcanzaban 4,5:1 para texto
  normal sobre sus superficies reales.
- **Antes:** claro `--faint #a1a1a1` sobre card `#ffffff` → 2,58:1 y
  `--muted-foreground #8f8f8f` → 3,23:1; oscuro `--faint #707070` sobre card
  `#111111` → 3,81:1. Además, el texto de los eventos de ausencia
  (`--primary-foreground` sobre fondo `--faint`, `eventPropGetter` del
  `ShiftCalendar`, que el hallazgo no citaba) quedaba en 2,58:1 claro y 4,00:1 oscuro.
- **Fix, 3 líneas en `app/globals.css`:** claro `--muted-foreground #8f8f8f → #666666`
  y `--faint #a1a1a1 → #6d6d6d`; oscuro `--faint #707070 → #878787`. El
  `--muted-foreground` oscuro (`#8f8f8f`) ya cumplía (5,10–6,12:1) y no se toca.
  La jerarquía de grises se conserva: body → muted-foreground → faint, cada vez
  más tenue dentro de cada tema.
- **Guard numérico `lib/design/wcag-contrast.test.ts`:** recalcula la fórmula WCAG 2.x
  (luminancia relativa y ratio de contraste) leyendo `app/globals.css`, sin
  dependencias nuevas, y comprueba body, muted-foreground y faint sobre cinco
  superficies por tema (card, popover, background, muted —hover de los chips de
  mes— y celda "hoy" con `bg-muted/60` compuesto sobre card) más el par
  texto/fondo del evento de ausencia: 34 casos.
- `DESIGN.md` actualizado con los tres valores y una nota que enlaza el guardián.

## Cómo se verificó
- RED antes del cambio: 17/34 fallan con exactamente los ratios del hallazgo
  (2,58 · 3,23 · 3,81) más los pares de hover y de evento. GREEN después: 34/34,
  el más justo 4,59:1 (`--faint` oscuro sobre hover muted) y 4,62:1 el más justo
  del tema claro.
- `npm test`: 148/148 en 18 ficheros (114 previos + 34 del guardián).
- `npx tsc --noEmit`: sin errores. `npm run lint`: solo el warning previo de
  `lib/schedule/email.ts:76`. `npm run build`: exit 0 con las mismas rutas, y
  `.next/BUILD_ID` posterior a los ficheros tocados.
- Sin preview ni BD real: verificación de cadena técnica y prueba numérica;
  la verificación visual es de Manuel.

## No tocado
- Otros hallazgos del registro; el registro en sí (el padre hace la transición);
  `--muted-foreground` oscuro; los usos decorativos de `--faint` (patrón del
  `WeekMatrix`, chevrón del sidebar), que heredan el nuevo tono sin cambios de API.
