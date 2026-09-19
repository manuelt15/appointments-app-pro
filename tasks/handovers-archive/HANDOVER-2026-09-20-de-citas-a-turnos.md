# Handover 2026-09-20 — De app de citas a planificador de turnos, y a producción

Sesión larga. La aplicación cambió de dominio por completo, se desplegó y se vació la base
de producción. La card del portfolio que la anuncia se actualizó en `manuelt15/profile`,
commit `f6fbb70`.

## Qué se hizo

**Commits:** `3d0f417` (el cambio de dominio, 93 ficheros), `2ef63f8` (el renombrado
pendiente documentado), `d991596` (merge a `main`). Todos con `manueltorres1512@gmail.com`.

### El dominio

Un turno es un bloque de tiempo que pertenece a **una persona**, con tipo: jornada,
vacaciones, baja o tiempo libre. Dos turnos de la misma persona no pueden solaparse; dos
personas sí pueden trabajar a la vez.

- `Shift` sustituye a `Appointment` y apunta directo a `employeeId`. **Se eliminaron
  `Calendar` y `Room`** junto con sus rutas, páginas y componentes. La indirección
  calendario ya no aportaba nada.
- `lib/appointments/` pasó a `lib/shifts/` con `git mv`, conservando el historial.
- El empleado gana teléfono, cumpleaños y fecha de incorporación.

### La interfaz

- **La semana es una matriz propia**, no react-big-calendar: una fila por empleado, una
  columna por día. Se hizo así porque react-big-calendar en vista semanal **repite los
  siete días dentro de cada empleado**, y con dos personas ya salían catorce columnas.
- Se eliminó la vista Day y con ella la reasignación por arrastre, que solo existía allí.
- Selectores de fecha y fecha-hora propios, porque el nativo del navegador no gustaba.
  Cero dependencias nuevas: `radix-ui` ya incluía `Popover` y `date-fns` ya estaba.
- Ficha de empleado con historial navegable mes a mes y saldo anual de vacaciones de 30
  días naturales, contando solo `vacation`.

### Producción

Desplegada en `appointments-app-pro.vercel.app`. **La base quedó con una sola cuenta**,
`manueltorres1512@alumnos.cei.es`, y sin ningún otro dato: se borraron 4 usuarios, 3
vínculos OAuth, 4 negocios y 1 api key. También se eliminaron las colecciones muertas
`appointments`, `calendars` y `rooms`.

## Cómo se verificó

```
npx tsc --noEmit   → exit 0
npx eslint .       → exit 0
npx vitest run     → 93 tests, exit 0
npx next build     → exit 0
```

Prueba real contra Mongo, con api key temporal creada y borrada después: turno creado,
**solape de la misma persona rechazado con 409**, mismo tramo para otra persona aceptado
con 201, rango invertido rechazado con 400, y cobertura devolviendo quién trabaja.

En producción, tras el despliegue: `Shift App` en el HTML, rutas viejas en 404
(`/api/appointments`, `/api/calendars`, `/api/rooms`), nuevas en 401
(`/api/shifts`, `/api/coverage`, `/api/schedule/pdf`), favicon en 200 como `image/svg+xml`.

El PDF se verificó **extrayendo su texto**, no solo comprobando que pesara algo: contenía
el nombre del negocio, el rango de la semana, los siete días y cada empleado con sus horas.

## Qué queda abierto

1. **Proveedor de email.** El botón prepara un mensaje por empleado pero no entrega nada.
   El único punto a tocar es `sendEmail` en `lib/schedule/email.ts`, junto con
   `isEmailConfigured`. Se dejó así a propósito para no atar el proyecto a un servicio.
2. **Renombrar a `shift-app-pro`** el repositorio, el proyecto de Vercel y la URL. Los
   cinco pasos están en el README, sección "Nombre del proyecto". **Rompe el login con
   Google y GitHub hasta actualizar sus callbacks**, por eso se aplazó.
3. **Api key del MCP.** La de producción se borró con el resto. Hay que generar otra en
   Settings y pegarla en `.mcp.json`, que quedó con un placeholder y apuntando a
   `localhost:3000` a propósito, para no dejar que un agente toque producción por defecto.
4. **Mover el repo fuera de `~/Desktop`**, que iCloud sincroniza. Ver `lessons.md`.

## Backups

Se hicieron antes de cada borrado y quedaron en el scratchpad de la sesión, que es
temporal: `PROD-appointments-pro-prod-20260919-233113.json` y
`appointments-pro-20260919-222332.json`. **Si no se copiaron a otro sitio, ya no existen.**
Contenían hashes de contraseñas de las cuentas borradas.
