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
