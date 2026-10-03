# Plan activo

## Handovers

- [2026-10-03 · Home, historial, navegación y zona horaria del PDF](handovers-archive/HANDOVER-2026-10-03-home-historial-navegacion.md)
  — sidebar nuevo, modo oscuro, `/home` de entrada, `/history` con PDF y fix de zona horaria; todo en `main`.
- [2026-09-20 · De citas a turnos, y a producción](handovers-archive/HANDOVER-2026-09-20-de-citas-a-turnos.md)
  — el cambio de dominio entero, el despliegue y el vaciado de la base de producción.

Ver también [lecciones](lessons.md).


## Base shadcn + flujo crítico de citas

- [x] Sustituir `DESIGN.md` por la guía Geist/Vercel adaptada a esta aplicación.
- [x] Inicializar shadcn/ui con Tailwind CSS v4 y los tokens Geist/Vercel.
- [x] Añadir primitives mínimos: Button, Input, Label, Select y Dialog.
- [x] Migrar el formulario de citas a los primitives, con accesibilidad y responsive.
- [x] Corregir validación `endTime > startTime` en creación y edición.
- [x] Permitir y validar el cambio de calendario al editar.
- [x] Impedir solapamientos al mover, redimensionar o editar una cita.
- [x] Persistir las relaciones de empleado/sala derivadas del calendario.
- [x] Añadir manejo de errores de red para que formulario y calendario no queden bloqueados.
- [x] Añadir pruebas enfocadas para las reglas críticas.
- [x] Verificar tests, tipos, lint enfocado, build y ausencia de secretos en el diff.

## Tandas 1 y 2 — completadas

- [x] Actualizar Next.js, Auth, Mongoose y MongoDB Driver con versiones corregidas.
- [x] Actualizar el SDK MCP y regenerar su lock/build.
- [x] Dejar `npm audit --omit=dev` en cero para app y MCP.
- [x] Aplicar la timezone IANA del negocio en calendario, formulario y rangos API.
- [x] Validar timezone e ISO 8601 con offset.
- [x] Corregir filtros y paginación para no truncar citas.
- [x] Alinear disponibilidad REST/MCP como comprobación de intervalo exacto.
- [x] Añadir pruebas y verificar autenticación, MCP, tipos, lint enfocado y build.

## Tanda 3 — migración visual Geist/shadcn

- [x] Ajustar primitives para targets táctiles, hover y foco.
- [x] Migrar shell principal y navegación responsive.
- [x] Migrar login, registro y onboarding de negocio.
- [x] Migrar páginas y formularios de empleados/salas.
- [x] Migrar listas y settings con estados de carga/error accesibles.
- [x] Terminar dashboard/calendario sin literales visuales antiguos.
- [x] Verificar lint UI, tipos, tests y build.

## Tanda 4 — calidad Next.js

- [x] Resolver los errores y warnings restantes del lint global.
- [x] Excluir artefactos compilados del MCP del lint de fuente.
- [x] Migrar `middleware.ts` a `proxy.ts` según Next.js 16.
- [x] Verificar lint global, tipos, tests y build sin warnings de convención.

## Tanda 5 — reserva atómica

- [x] Añadir lease distribuido por negocio/calendario en MongoDB.
- [x] Serializar comprobación de conflicto y escritura en POST/PUT.
- [x] Recuperar locks huérfanos por expiración y devolver 503 si el recurso sigue ocupado.
- [x] Añadir pruebas del ciclo adquirir/liberar y verificar toda la app.

## Pendiente posterior

- [x] Ejecutar una prueba E2E autenticada con MongoDB real: crear, editar, mover, cancelar y lanzar reservas concurrentes.
- [x] Revisar el diff completo.
- [x] Commit autorizado con la cuenta personal `manuelt15`.

## Tanda 6: de citas a turnos de empleados

Decisiones tomadas: el turno apunta directo al empleado (se elimina la indirección
`Calendar`), desaparece el concepto de sala, y se parte de base de datos limpia.
Backup previo de la base local en el scratchpad de la sesión.

### Dominio

- [x] Crear `lib/mongodb/models/Shift.ts`: `businessId`, `employeeId`, `startTime`, `endTime`, `type`, `notes?`.
- [x] Definir `Shift` y `ShiftType` en `types/index.ts` y retirar `Appointment`, `Calendar` y `Room`.
- [x] Eliminar los modelos `Appointment`, `Calendar` y `Room`.

### Lógica de negocio

- [x] Reapuntar `buildConflictFilter` de `calendarId` a `employeeId`.
- [x] Quitar de `validation.ts` y `list-query.ts` todo lo relativo a cliente y estado de cita.
- [x] Reapuntar el lease de `scheduling-lock` a `businessId` + `employeeId`.
- [x] Convertir `availability` en "quién trabaja en este tramo" en vez de "hay hueco".
- [x] Actualizar los tests existentes de `lib/appointments/` al dominio nuevo.

### API

- [x] Crear `/api/shifts` (GET con filtros y rango, POST) y `/api/shifts/[id]` (GET, PUT, DELETE).
- [x] Eliminar `/api/appointments`, `/api/calendars` y `/api/rooms`.
- [x] Quitar de `/api/employees` la creación automática de calendario.
- [x] Solapes: dos turnos del mismo empleado no pueden pisarse; distintos empleados sí.

### Interfaz

- [x] Sustituir `AppointmentModal` por `ShiftModal`: empleado, tramo, tipo y nota.
- [x] Pasar `GlobalCalendar` a columnas por empleado con el soporte de recursos de react-big-calendar.
- [x] Colorear el turno según `type` y según el color del empleado.
- [x] Eliminar `RoomList`, `rooms/page.tsx` y `rooms/new/page.tsx`, y su entrada en `Sidebar`.
- [x] Mantener el aviso de estado vacío apuntando ahora solo a crear empleado.

### Servidor MCP

- [x] Renombrar las herramientas a `list_shifts`, `create_shift`, `update_shift` y `delete_shift`.
- [x] Retirar de sus esquemas los parámetros de cliente, sala y calendario.
- [x] Recompilar `mcp/dist`.

### Verificación

- [x] `npx vitest run` en verde.
- [x] `npx tsc --noEmit` sin errores.
- [x] `npx eslint .` sin errores nuevos.
- [x] `npx next build` sin errores.
- [x] Prueba real contra Mongo: crear empleado, crear turno, moverlo, solapar y comprobar el rechazo.
- [x] Revisar el diff completo y confirmar que no se cuela ningún secreto.

### Fuera de alcance salvo que se pida

- No se despliega a producción, que seguirá sirviendo el dominio de citas hasta que se decida.
- No se renombra el repositorio ni el proyecto de Vercel.

## Tanda 7: datos de empleado, horas semanales y exportación

- [x] Añadir teléfono, cumpleaños y fecha de incorporación al empleado, como fechas de calendario en texto plano.
- [x] Marcar el cumpleaños en la matriz con tokens propios `--birthday`.
- [x] Ficha de empleado en `/employees/[id]` con contacto, antigüedad, totales e historial.
- [x] Edición de empleado reutilizando el formulario del alta.
- [x] Mostrar las horas semanales junto a cada nombre en la matriz.
- [x] Descargar la semana en PDF generado en servidor con `pdf-lib`.
- [x] Preparar los emails por empleado, con el envío pendiente de proveedor.
- [x] Serializar los documentos de Mongo antes de pasarlos a la lógica compartida.
- [x] Verificar tipos, lint, tests, build y una prueba real de PDF y emails.

### Pendiente

- [ ] Elegir proveedor de email y completar `sendEmail` en `lib/schedule/email.ts`.
- [x] Actualizar README, `package.json` y documentación al nombre Shift App.
- [ ] Renombrar repositorio y proyecto de Vercel a `shift-app-pro`: aplazado a propósito,
      porque cambia la URL y obliga a rehacer los callbacks de OAuth. Los pasos están
      documentados en el README, sección "Nombre del proyecto".

## Tanda 8: historial mensual, vacaciones y marca

- [x] Navegar el historial del empleado mes a mes, con totales de ese mes.
- [x] Saldo anual de vacaciones de 30 días, con días tomados, restantes y los del mes visible.
- [x] Sustituir el mensaje del panel, que describía un arrastre que ya no existe.
- [x] Favicon propio en `app/icon.svg` y excluirlo del matcher de `proxy.ts`.
- [x] Blindar `tsconfig.json` contra los ficheros duplicados que genera iCloud.

## Abierto al cerrar el 2026-09-20

- [ ] Elegir proveedor de email y completar `sendEmail` en `lib/schedule/email.ts`.
- [ ] Renombrar repositorio, proyecto de Vercel y URL a `shift-app-pro`. Pasos en el
      README, sección "Nombre del proyecto". Rompe el login hasta actualizar los callbacks
      de Google y GitHub.
- [ ] Generar api key nueva en Settings y pegarla en `.mcp.json`, que quedó con un
      placeholder apuntando a `localhost:3000`.
- [ ] Mover el repo fuera de `~/Desktop`, que iCloud sincroniza y duplica ficheros dentro
      de `.next`. Mitigado en `tsconfig.json`, no resuelto.
- [ ] Decidir si la base de producción se renombra de `appointments-pro-prod`. Hacerlo
      ahora cuesta poco: solo hay una cuenta y un negocio dentro.

## Tanda 9: historial del negocio (2026-10-03)

Página propia `/history`, con icono en el sidebar. Sin cambios de backend: usa `GET /api/shifts`
por rango y los cálculos de `lib/shifts/history.ts`. Meses en la zona horaria del negocio.

- [x] Helper puro `lib/shifts/business-history.ts` con tests: límites de mes en la zona del
      negocio, resumen de los 12 meses del año y filas por empleado (turnos, horas, días
      trabajados, ausencias) → verify: `npm test` en verde.
- [x] `app/(main)/history/page.tsx`: lee del servidor timezone y empleados, incluidos los
      dados de baja, para que sus turnos antiguos lleven nombre → verify: carga sin errores.
- [x] Selector de año (‹ 2026 ›) y lista de sus 12 meses con horas y nº de empleados; al
      pulsar un mes se abre → verify: cambiar de año y de mes en el navegador.
- [x] Resumen del mes: horas, turnos, empleados que trabajaron y ausencias.
- [x] Tabla por empleado; al pulsar una fila se abre su ficha `/employees/[id]`.
- [x] Filtros: "Solo quienes trabajaron" (activo por defecto), empleado y tipo; afectan a la
      tabla y al detalle → verify: filtrar en el navegador y cuadrar totales.
- [x] Detalle de turnos del mes: fecha, empleado, horario, horas, tipo y notas.
- [x] Icono "History" en el sidebar, con tooltip → verify: tsc, eslint, claro y oscuro.
- [x] Selector de año desplegable (últimos 10 años) además de las flechas.
- [x] "Download PDF" del mes con los filtros activos, generado en el navegador con pdf-lib
      (`lib/schedule/history-pdf.ts`, con tests de varias páginas y caracteres no WinAnsi).
- [x] Móvil: cabecera con logo + flecha a la izquierda; el menú entra deslizando desde la izquierda.

## Tanda 10: Home (2026-10-03)

- [x] Helper `lib/schedule/home-week.ts` con tests: semana actual (lunes a domingo) en la zona
      del negocio, por empleado sus días con horario o ausencia, horas, y quién no tiene nada.
- [x] `app/(main)/home/page.tsx` (server): bienvenida con imagen del negocio, nombre y mensaje
      breve; resumen de la semana con quién trabaja, qué días y en qué horario.
- [x] Avisos: "X empleados sin horario esta semana" (con sus nombres) y "No hay horario para
      esta semana" si no hay ningún turno; los dos con enlace a Schedule / New shift.
- [x] Icono de casa en el sidebar, el primero; Home pasa a ser la página de entrada (raíz,
      login, OAuth, proxy y alta de negocio) → verify: login lleva a /home.
- [x] verify: tsc, eslint, tests, claro/oscuro y móvil en el navegador.
- [x] Alturas en móvil: la estructura mide lo que la pantalla (`h-dvh`, con `h-screen` de reserva) y
      solo hace scroll `<main>`; sin rebote del documento. Sidebar con divisores de puntos.
- [x] `buildEmployeeWeeks` (PDF y emails del calendario) formatea horas en la zona del servidor:
      en Vercel (UTC) saldrían 1-2 h desplazadas para Madrid. Arreglado: semana, días y horas en
      la zona del negocio, con tests que fallaban con `TZ=UTC`.

## Abierto al cerrar el 2026-10-03

- [ ] Comprobar el despliegue de producción en Vercel tras el push de `41dc0c1` a `main`.
- [ ] Modo oscuro: los estilos de react-big-calendar ganan a nuestras overrides `.rbc-*`
      (van en `@layer components`); vista Mes con días claros. Repasar también modal,
      Employees, Settings y login en oscuro.
- [ ] Campo de imagen en `Business`; hoy todos usan `public/business-default.svg`.
- [ ] Unificar cómo cuentan las horas de un turno nocturno entre meses la ficha de
      empleado (todo al mes de inicio) y el historial (repartido).
- [ ] Decidir si se borra la rama `feat/shift-scheduling` (anterior a esta sesión).
- [ ] Defensas de iCloud en `.gitignore` (`* [0-9]`, `* [0-9].*`, …): ofrecidas, sin aplicar.
