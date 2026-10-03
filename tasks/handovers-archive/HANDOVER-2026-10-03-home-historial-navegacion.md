# Handover 2026-10-03 · Home, historial, navegación y zona horaria del PDF

Sesión de producto y diseño sobre Shift App, todo fusionado en `main` y subido a
`origin/main` (`41dc0c1`). Cuenta de GitHub usada: `manuelt15` (email del repo
`manueltorres1512@gmail.com`).

## Qué se hizo

| Commit | Contenido |
|---|---|
| `fcce238` | Sidebar de iconos plegable (64/240 px) con tooltips, imagen del negocio, New shift azul, separadores finos; modo oscuro sistema/claro/oscuro; tarjeta de usuario con menú de Sign out y proveedor de login; cabecera móvil con drawer desde la izquierda; shell a `h-dvh` con scroll solo en `<main>` |
| `391879c` | Selector de semana en el rango de fechas del calendario; New shift abre el modal desde cualquier página vía `/dashboard?new=shift` |
| `88fd73f` | `/history`: 12 meses del año con horas y personas, resumen, tabla por empleado, registros, filtros y descarga en PDF (pdf-lib en el navegador) |
| `1903a98` | `/home` como página de entrada: bienvenida y semana en curso, con avisos de empleados sin horario o semana vacía |
| `73b953d` | README y DESIGN.md actualizados |
| `01aa974` | Merge de la rama `feat/home-history-navigation` (borrada después, local y remota) |
| `828f806` + `78ee153` | Fix: PDF y emails del cuadrante usan la zona del negocio, no la del servidor. Lo hizo una sesión aparte en un worktree; revisado y fusionado aquí |
| `41dc0c1` | todo.md: fix marcado como hecho |

Decisiones del usuario:
- Historial en página propia, no en Settings.
- Formato de descarga del historial: PDF.
- Home es la entrada (raíz, login, OAuth, proxy y alta de negocio llevan a `/home`).
- En Home, una semana con solo ausencias cuenta como asignada.

## Cómo se verificó

- `npx tsc --noEmit` → `No errors found` en `main` final.
- `npx vitest run --exclude ".claude/**"` → `PASS (112)`, y lo mismo con `TZ=UTC`.
  En el worktree del fix, `lib/schedule` pasaba con `TZ=UTC` y `TZ=America/New_York` (16 tests).
- `eslint .` → 0 errores, 1 aviso preexistente (`_message` en `lib/schedule/email.ts:76`).
- Navegador (panel de Claude, dev server en :3000):
  - Sidebar medido por JS: iconos centrados a 32 px en plegado.
  - Tema: el ciclo deja `data-theme` y la clase `dark` correctos; "System" sigue `prefers-color-scheme` en vivo.
  - Historial de septiembre 2026: 32 h + 18 h = 50 h y 6 turnos, cuadra con la Home de esa semana.
  - PDF del historial: generado e interceptado (`%PDF-`, `history-2026-09.pdf`); muestra renderizada con `sips` para revisar el diseño.
  - Móvil 375×812: documento = viewport y dashboard = 756 px (812 − 56).
  - Drawer: entra desde `left: -177` hasta `0`.
  - Menú de usuario dentro del drawer: queda en 12–228 px y Sign out recibe el toque.
- No se ejecutó `next build`: choca con el dev server, porque ambos escriben en `.next`.

## Pendiente

- **Despliegue a producción.** No se comprobó en Vercel tras el push a `main`. Revisar el panel o `vercel ls`.
- **Proveedor de login.** "Signed in with Google" solo aparece tras volver a entrar: el proveedor se guarda en el JWT en el momento del login (`auth.config.ts`).
- **Imagen del negocio.** Es siempre `public/business-default.svg`: el modelo `Business` no tiene campo de imagen.
- **Vistas en modo oscuro sin repasar.** La vista Mes del calendario, el modal de turnos, Employees, Settings y login.
  - Problema conocido: los estilos de react-big-calendar ganan a nuestras overrides de `.rbc-*` en `globals.css`, porque las nuestras van en `@layer components` y las suyas no tienen capa. Por eso los días fuera de mes y el de hoy salen claros en oscuro.
- **Horas de turnos nocturnos.** La ficha de empleado cuenta un turno nocturno que cruza de mes entero en el mes de inicio; el historial lo reparte entre los dos meses. Decidir si se unifica.
- **Rama `feat/shift-scheduling`.** Sigue viva; es de antes de esta sesión y no se tocó.
- **Defensas de iCloud.** El repo está en `~/Desktop` y `.gitignore` no tiene los patrones de duplicados (`* [0-9]`, …). Ofrecido, sin aplicar.
- Siguen abiertos los puntos del 2026-09-20 en `todo.md`: proveedor de email, renombrado a `shift-app-pro`, api key en `.mcp.json` y mover el repo fuera del Escritorio.

## Trampas

- **HMR de Turbopack sirvió CSS y JS viejos.** Tras editar `globals.css` la regla `.dark` no llegaba, y tras añadir `?new=shift` el modal no abría. En los dos casos se arregló tocando el fichero o recargando. Antes de depurar, recarga.
- **La consola del panel acumula errores de toda la sesión.** Errores de momentos intermedios (`Toaster is not defined`, `THEME_OPTIONS is not defined`) siguen listados aunque el código actual esté bien. Para comprobar, engancha `console.error` y navega de nuevo.
- **El aviso de hidratación con `cz-shortcut-listen`** en `<body>` viene de la extensión ColorZilla, no de la app.
- **`<script>` en layouts de React 19** da un error en dev. Se resolvió con el patrón de `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`: `type` javascript en servidor y `text/plain` en cliente, con `suppressHydrationWarning`.
- **vitest ejecuta los tests de `.claude/worktrees/`.** Con una sesión paralela en un worktree, el recuento sube (205 en vez de 108). Usar `--exclude ".claude/**"`.
- **`cd` dentro de un worktree cambia el directorio de la sesión.** Desde ahí, para el checkout principal, usar `git -C <ruta>`.
- **Clics por coordenadas en el panel fallan** cuando el viewport es más grande que la captura: un clic acabó en la ficha de un empleado. Usar `ref` o hacer el clic por JS.
- **Datos de prueba.** No se crearon turnos en la base para probar la Home con datos, porque `.env.local` podría apuntar a producción. Se fijó `now` temporalmente en la página y se revirtió.
