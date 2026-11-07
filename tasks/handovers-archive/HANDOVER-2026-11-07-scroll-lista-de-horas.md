# Handover 2026-11-07: scroll de la lista de horas en el modal de turnos

## Qué se hizo
- Clon restaurado en `~/Developer/appointments-app-pro` con `.env.local` y `.mcp.json`
  copiados de `~/Developer/_env-backups/`, como indica `todo.md`.
- **Bug:** en el modal de turno (`ShiftModal`), la lista de horas del `DateTimePicker` no
  hacía scroll con la rueda. Causa: el `Popover` se pinta en un portal, fuera del `Dialog`,
  y el bloqueo de scroll del `Dialog` modal se come la rueda en todo lo que queda fuera.
- **Fix:** `<Popover modal>` en `components/ui/date-time-picker.tsx`. El Popover modal pone
  su propio bloqueo encima del del Dialog y deja hacer scroll dentro de su contenido.
  Commit `5d63a6a`, sin push.

## Cómo se verificó
- Reproducido antes del fix en `next dev` con una cuenta de prueba local: rueda sobre la
  lista, `scrollTop` se queda en 0.
- Después del fix: `scrollTop` pasa de 0 a 500, elegir las 10:00 guarda la hora y cierra el
  selector. Sin errores en consola.
- `vitest run` 112 en verde, `eslint` sin avisos en el fichero, `tsc --noEmit` sin errores,
  `next build` exit 0.
- Datos de prueba (usuario, negocio y empleado) borrados de la base local después.

## Qué queda
- Al abrir el selector, la lista empieza en 00:00 en vez de centrarse en la hora elegida:
  el `useEffect` que hace `scrollIntoView` corre antes de que el portal monte la lista.
  Ya pasaba antes del fix. Sin tocar, a decidir por Manuel.

## Trampas
- Radix: cualquier Popover o Select dentro de un Dialog modal necesita `modal` (o no ir en
  portal) para que su contenido haga scroll. Los `Select` del modal ya funcionan porque
  Radix Select gestiona su propio bloqueo.
