# Lecciones

## ESLint rechaza `setState` dentro del cuerpo de un `useEffect`

Este repo tiene activa `react-hooks/set-state-in-effect`, que no viene por defecto en
muchos proyectos. Llamar a un setter de estado directamente en el cuerpo de un efecto
es **error**, no aviso, y tumba `npx eslint .`.

Tropecé con ella tres veces en la misma sesión: al marcar la carga de calendarios en el
modal, al leer `window.location.origin` en Settings y al sincronizar el mes del
selector de fecha.

Las tres salidas correctas, por orden de preferencia:

1. **Si es un evento, va en el handler.** Sincronizar estado al abrir un popover
   pertenece a `onOpenChange`, no a un efecto que observa `open`.
2. **Si es estado externo del navegador, `useSyncExternalStore`.** Es el patrón que el
   propio repo ya usaba en el calendario, y además no rompe el render de servidor.
   Su tercer argumento es el valor del servidor.
3. **Si el valor inicial basta, no hace falta efecto.** Un `useState(true)` inicial evita
   el `setState(true)` de arranque.

Antes de dar por terminado cualquier cambio de UI: `npx eslint .`, no solo el fichero tocado.

## `next build` borra lo que el `next dev` está sirviendo

Borrar `.next` o lanzar un build con el servidor de desarrollo levantado lo deja
devolviendo 500 hasta reiniciarlo. Si hace falta regenerar tipos de rutas
(`RouteContext` vive en `.next/types`), parar el dev server primero y rearrancarlo después.

## `.lean()` devuelve ObjectId, aunque el tipo diga `string`

`Employee.find().lean<Employee[]>()` es una promesa que Mongoose no cumple: en
ejecución `_id` sigue siendo un `ObjectId` y las fechas siguen siendo `Date`.
El genérico solo silencia a TypeScript.

Costó un bug silencioso en la exportación semanal: `shift.employeeId === employee._id`
comparaba string contra ObjectId, daba `false` siempre, y el resultado era
"Nothing scheduled" para gente que sí tenía turnos. Ni `tsc` ni los tests lo
vieron, porque los tests usaban strings igual que el navegador, que recibe los
datos ya serializados a JSON.

Regla: todo documento que cruce de Mongo a lógica compartida pasa por
`lib/schedule/serialize.ts`. Y cuidado al escribir tests de lógica que se
ejecuta en servidor: si los datos de prueba son más limpios que los reales, el
test pasa y el código falla.

## El Escritorio está en iCloud y duplica ficheros

Aparecieron `routes.d 4.ts`, `validator 4.ts`, `.next/cache 2` y compañía dentro
de `.next`, y rompieron `tsc` con errores de identificadores duplicados. Es iCloud
resolviendo conflictos de sincronización sobre carpetas que cambian sin parar.

Remedio inmediato: `rm -rf .next` y reconstruir. Remedio de fondo: el repo debería
vivir fuera de rutas sincronizadas, en `~/Developer/`.

## El proxy de auth también intercepta los iconos

Al sustituir `app/favicon.ico` por `app/icon.svg`, el favicon dejó de cargar: el
matcher de `proxy.ts` excluía `favicon.ico` por su nombre literal, así que la
petición del icono nuevo pasaba por la autenticación y se iba redirigida a `/login`.

Se veía bien en el HTML (`<link rel="icon">` correcto) y solo se detectaba pidiendo
la URL: devolvía 307 en vez del SVG. Al tocar ficheros especiales de Next en `app/`,
comprobar el matcher del proxy, y verificar el recurso con una petición, no mirando
el marcado.
