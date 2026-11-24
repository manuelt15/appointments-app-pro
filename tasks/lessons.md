# Lecciones

## La autoridad de una clave no sustituye la vinculación de la herramienta

Validar como ObjectId todos los selectores MCP antes de interpolarlos en rutas, también
en dist versionado: `../employees/id` puede transformar la eliminación de un turno en
la baja de una persona aunque ambas operaciones pertenezcan al mismo negocio.
La regresión debe alcanzar el handler final con datos ficticios, no limitarse a mirar
la cadena URL. Reservar la emisión y revocación de credenciales a la sesión del dueño
evita que una clave delegada cree otra que sobreviva a su propia revocación.

## Una búsqueda ARIA debe distinguir comentarios de marcado

No dar por activa una cadena `role="grid"` encontrada dentro de un comentario JSX que
explica precisamente por qué se retiró ese rol. Comprobar el marcado o las propiedades
reales del componente; una coincidencia literal sobre todo el fichero puede invalidar
erróneamente un arreglo correcto.

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

## Mongoose cachea el modelo: los campos nuevos se descartan en silencio

Se añadieron `phone`, `birthday` y `startDate` al esquema de `Employee`. La validación
rechazaba correctamente una fecha inválida, pero los tres campos **llegaban vacíos** a la
base. El código estaba bien.

La causa es que Mongoose registra el modelo una vez (`models.Employee ?? model(...)`) y el
servidor de desarrollo conservaba el esquema anterior. En modo estricto, los campos que no
están en el esquema se descartan sin avisar.

Al reiniciar el dev server, los tres se guardaron. **Al añadir campos a un modelo, reiniciar
antes de concluir que el código falla.**

## Un `exclude` de tsconfig no admite `[0-9]`

Para frenar los duplicados de iCloud se añadió `"**/* [0-9].ts"` al `exclude` de
`tsconfig.json`. No sirvió de nada: TypeScript solo admite `*`, `?` y `**/` en esos globs,
no clases de caracteres.

El patrón correcto es `"**/* ?.ts"`. Se comprobó dejando los ficheros duplicados en su
sitio a propósito y confirmando que `tsc` pasaba igualmente. **Un exclude que no excluye
se ve idéntico a uno que funciona hasta que aparece el fichero que debía filtrar.**

## Un test más limpio que la realidad no prueba nada

La exportación semanal daba "Nothing scheduled" para empleados que sí tenían turnos.
`shift.employeeId === employee._id` comparaba una cadena contra un `ObjectId`, porque
`.lean()` devuelve `ObjectId` aunque se tipe la llamada como `.lean<Employee[]>()`. El
genérico solo silencia a TypeScript.

Ni `tsc` ni los tests lo vieron: **los tests usaban cadenas, igual que el navegador**, que
recibe los datos ya serializados en JSON. El único sitio donde el dato es un `ObjectId` es
el servidor, y ahí no había test.

Se resolvió con una frontera explícita, `lib/schedule/serialize.ts`, cubierta por tests que
usan un doble de `ObjectId`. **Al testear lógica que corre en servidor, los datos de prueba
deben parecerse a los de Mongo, no a los del navegador.**

## Un 200 no significa que el fichero exista

Al verificar que una imagen borrada ya no se servía, `curl` devolvía 200. No era la imagen:
era el `index.html` del SPA, porque el `vercel.json` reescribe cualquier ruta a la raíz.

**Para comprobar si un asset existe en producción, mirar `content-type` y tamaño, no el
código de estado.** Aplica a cualquier SPA con rewrite catch-all.

## El proxy de auth también intercepta ficheros especiales de Next

Ya está contado arriba con el favicon, pero conviene recordarlo al añadir cualquier fichero
nuevo en `app/` que se sirva por URL propia: comprobar el matcher de `proxy.ts` y verificar
el recurso pidiéndolo, no leyendo el HTML.

## Emular el tema en el panel del navegador deja la pestaña falseada

**Corrección (2026-10-03):** "estoy en System y se ve oscuro, y el mío es claro".
**Causa:** para probar "System" forcé `prefers-color-scheme: dark` en la pestaña del panel
con `resize_window` y no lo deshice; la app obedecía a la emulación, no al sistema.
**Fix:** `resize_window` con `colorScheme: light` y comprobar `matchMedia` en la página.
**Regla:** toda emulación de viewport o color scheme que se ponga para verificar se revierte
en el mismo paso. Y "System" en el panel refleja el tema de la app de Claude, no siempre el
de macOS.

## Textos de la interfaz escritos como programador

**Corrección (2026-11-07):** "si vas a agregar textos al loader que sean textos que no sean
nada técnicos, que sean para una app normal".
**Causa:** las etiquetas del loader salieron como "Getting history" o "Getting API keys":
describían la petición, no lo que vive la persona.
**Fix:** frases cercanas ("Putting your week together", "Gathering your team") y la regla
escrita en `DESIGN.md`.
**Regla:** todo texto visible se escribe para quien usa la app, no para quien la programa:
nada de "fetch", "API", "data", "loading" ni nombres de colecciones.

## La cabecera no se centra: solo el contenido usa el ancho máximo

**Corrección (2026-11-24):** "las demás páginas quedan a la izquierda y así quiero que sea; lo único
que no debe dejar espacio es el contenido de la página".
**Causa:** al ensanchar Ajustes metí el título y el subtítulo dentro del mismo contenedor centrado
(`mx-auto max-w-7xl`) que el contenido, así que en pantallas grandes la cabecera se iba al medio y
dejaba de parecerse al resto de la app.
**Fix:** la cabecera vuelve al patrón de siempre, `border-b bg-card px-4 py-4 sm:px-6` con el `h1` y
el `p` dentro, sin envoltorio; el `mx-auto max-w-7xl` se queda solo en el bloque de contenido.
**Regla:** el ancho máximo y el centrado son del contenido. La cabecera va pegada al borde izquierdo
con su padding, igual en todas las páginas.

## Los radios se copian de la escala, no se inventan

**Corrección (2026-11-24):** "los interruptores del tema y el idioma me parecen muy circulares, no
siguen los mismos bordes que los demás elementos".
**Causa:** puse `rounded-xl` (16 px) en la caja y `rounded-lg` (12 px) dentro sin mirar la escala del
proyecto, donde los elementos dentro de una tarjeta usan 6 px (`rounded-sm`) y las tarjetas 12 px.
**Fix:** caja a `rounded-md` (8 px) y opción activa a `rounded-sm` (6 px); el botón colapsado, 8 px.
**Regla:** antes de elegir un radio, mirar `--radius` en `app/globals.css` y qué usan los componentes
vecinos. Un control nuevo tiene que parecer hermano de los que ya hay, no una pieza pegada.

## No se construye sobre una referencia que puede retirarse

**Corrección (2026-11-24):** "no prestes atención a la imagen del sidebar, me equivoqué".
**Causa:** lancé una tanda entera a construir un control segmentado a partir de una captura, sin
confirmar antes si era la referencia buena; cuando se retiró, hubo que revertir 12 minutos de trabajo.
**Fix:** revertido, y el interruptor de idioma rehecho después con la decisión ya cerrada.
**Regla:** cuando la referencia visual de un encargo es una captura, se confirma en una línea antes
de delegar. Y no se lanza una segunda tanda sobre la misma zona hasta cerrar la decisión de la primera.
