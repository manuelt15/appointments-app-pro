# Handover 2026-11-07: scroll de la lista de horas y recarga del calendario

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

## Recarga del calendario al guardar (segundo cambio del día)
- **Síntoma:** al crear un turno salía el aviso de éxito y la rejilla entera volvía a
  "Loading schedule…", como si se recargara la página.
- **Causa:** no era rendimiento (en local las APIs responden en 14 a 49 ms y tienen índices).
  `onSaved` suma `refreshKey`, eso pone `loading = true` y `ShiftCalendar` sustituía la
  rejilla por el aviso de carga hasta que volvían los datos.
- **Fix** (`ShiftCalendar.tsx`): el estado `loadedRange` guarda a qué rango pertenecen los
  turnos en pantalla. El aviso de carga solo sale si ese rango no es el visible. Además, la
  carga depende del rango (mes más una semana a cada lado, `getCalendarLoadRange`) y no de
  la fecha, así que moverse entre semanas del mismo mes no hace ninguna petición.
- **Verificado en el navegador** con un observador del DOM: al crear un turno, 0 apariciones
  del aviso, turno en la rejilla y horas actualizadas. Tres semanas de noviembre: 0
  peticiones y 0 avisos. Al pasar a diciembre, una carga. `vitest` 112 en verde, `tsc`,
  `eslint` y `next build` correctos. Datos de prueba borrados.
- **No tocado:** `ShiftModal` vuelve a pedir `/api/employees` cada vez que se abre aunque el
  calendario ya los tiene. Es una petición pequeña; pasarle los empleados por props obliga a
  cubrir el caso del botón "New shift" del sidebar, que abre el modal antes de que cargue
  el calendario.

## Qué queda
- Al abrir el selector, la lista empieza en 00:00 en vez de centrarse en la hora elegida:
  el `useEffect` que hace `scrollIntoView` corre antes de que el portal monte la lista.
  Ya pasaba antes del fix. Sin tocar, a decidir por Manuel.

## Trampas
- Radix: cualquier Popover o Select dentro de un Dialog modal necesita `modal` (o no ir en
  portal) para que su contenido haga scroll. Los `Select` del modal ya funcionan porque
  Radix Select gestiona su propio bloqueo.
