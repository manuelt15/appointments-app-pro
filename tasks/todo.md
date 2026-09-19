# Plan activo

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
- [ ] Renombrar el proyecto a `shift-app-pro` y actualizar README y `package.json`.
- [ ] Decidir qué se lleva a producción antes de desplegar.

## Tanda 8: historial mensual, vacaciones y marca

- [x] Navegar el historial del empleado mes a mes, con totales de ese mes.
- [x] Saldo anual de vacaciones de 30 días, con días tomados, restantes y los del mes visible.
- [x] Sustituir el mensaje del panel, que describía un arrastre que ya no existe.
- [x] Favicon propio en `app/icon.svg` y excluirlo del matcher de `proxy.ts`.
- [x] Blindar `tsconfig.json` contra los ficheros duplicados que genera iCloud.
