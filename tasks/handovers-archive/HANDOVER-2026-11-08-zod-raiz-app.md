# Handover 2026-11-08: zod de la app a 4.6.7 (agotamiento de memoria al validar)

## Qué se hizo
- **Hallazgo `appointments-2026-11-07-015` (MEDIA en el registro; High/CVSS 7.5 en GitHub y `npm audit`):**
  la app declaraba zod `^4.3.6` y el lock fijaba 4.3.6, dentro del rango vulnerable `<4.6.6`
  de **GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404** (verificado en el advisory de GitHub y con
  `npm audit` en la raíz): `handleArrayResult` de `$ZodArray` acumula un issue de validación
  por cada elemento que falla sin tope ni terminación temprana cuando el esquema tiene cota
  de longitud (CWE-770), de modo que un array gigante contra un esquema acotado agota la
  memoria del proceso. Los cuerpos JSON de `/api/*` se validan con este zod; hoy ningún
  esquema de la app declara `z.array`, así que la exposición concreta es la dependencia
  directa en rango vulnerable.
- **Parche mínimo:** `package.json` sube zod de `^4.3.6` a `^4.6.6` (el mismo suelo que
  declaró el MCP en el -010), que resuelve **4.6.7** — la misma versión que ya corre el MCP.
  1 línea de `package.json` y 4 de `package-lock.json` (spec, version, resolved, integrity).
  `npm ci --dry-run` exit 0. Subida dentro de la major 4: ninguna API nueva usada y la
  suite existente (validación, disponibilidad, rutas de API) lo confirma.
- **Guard `lib/dependencies/app-zod-version.test.ts`** (4 tests): exige zod >= 4.6.6
  declarado, resuelto e instalado, y guarda el comportamiento del parche:
  `z.array(z.string()).max(10)` contra 20.000 elementos fallidos no acumula un issue por
  elemento. Si falla, la app vuelve al rango vulnerable; súbelo de versión, no lo saltes.

## Cómo se verificó
- **RED** con 4.3.6 instalado: 4/4 fallan — los tres de versión por suelo < 4.6.6 y el
  conductual con `expected 20001 to be less than 100` (sonda previa: 4.3.6 devolvía
  50.001 issues para 50.000 elementos con `.max(10)`).
- **GREEN** con 4.6.7: 4/4 pasan — la cota corta la validación de elementos en cuanto se
  viola (1 issue, ~0 ms).
- Serie completa: `npx tsc --noEmit` sin errores; `npm run lint` solo el warning previo de
  `lib/schedule/email.ts:76` (0 errores); `npm test` **287/287** en 24 ficheros (283 previos
  + 4 del guard); `npm run build` exit 0 con `.next/BUILD_ID` (11:53:50) posterior a la
  última fuente tocada (11:52:00).
- `npm audit` raíz: `node_modules/zod` ya no aparece en GHSA-mrhx-c7xc-m3w5; queda solo la
  copia anidada de shadcn (otro hallazgo). Sin preview ni BD real (F2): verificación de
  cadena técnica y prueba conductual; `procesos-abiertos.py` en limpio.

## Resumen acumulado F2
- **-001:** `.env.local` dummy aislado (`127.0.0.1`, timeout alto) para verificar build sin
  BD real; gitignored.
- **-002:** contraste AA de los tokens de texto secundario (`--faint`, `--muted-foreground`)
  en ambos temas; guard numérico de 34 casos.
- **-003:** mover/redimensionar turnos con teclado — falso positivo: el modal de edición es
  la vía de teclado; guard de 25 checks en `keyboard-move.test.ts`.
- **-004:** texto legible sobre el color del empleado (`readableForeground`, WCAG 1.4.3);
  guard de 102 casos → `8723f22`.
- **-009:** proxy-addr del MCP a 2.0.8 (spoofing de IP crítico) → `eba2552`.
- **-010:** zod del MCP a 4.6.7 (este mismo GHSA; guard `mcp-zod-version.test.ts`) → `1385a24`.
- **-011:** SDK de MCP a 1.32.2 (seis avisos high) → `c512e40`.
- **-015 (este):** zod de la app raíz a 4.6.7, mismo GHSA que el -010 cerrado en el MCP.
- Todo local en `main`, sin push: el push lo gatea Manuel vía el padre.

## Pendientes (según registro; sin cambios)
- Otros hallazgos abiertos del `npm audit` raíz, sin tocar por indicación: zod anidado de
  shadcn (high, este mismo GHSA), SDK MCP `<=1.31.0` en `node_modules` raíz (high),
  body-parser (high), brace-expansion (high), vite/launch-editor (high), undici,
  @hono/node-server, @vitest/mocker + vitest, fast-uri, deepmerge vía shadcn (moderate)…
  30 vulnerabilidades en total tras este parche (1 low, 17 moderate, 9 high, 3 critical).
- Plan activo de `todo.md`, sin tocar: proveedor de email y `sendEmail` en
  `lib/schedule/email.ts` (con su warning de lint previo), renombrar repo/Vercel/URL a
  `shift-app-pro`, api key nueva en Settings → `.mcp.json`, renombrar la BD de producción,
  comprobar el deploy de Vercel, modo oscuro de react-big-calendar, campo de imagen en
  `Business`, unificar las horas del turno nocturno entre meses, bloque `.mcp.json` en
  Settings y publicar el MCP en npm.

## No tocado
- El MCP ni su zod (ya parcheado en el -010); la copia anidada de shadcn y el resto de
  hallazgos del audit (otros hallazgos del registro); el registro en sí (la transición la
  hace el padre); los pendientes del plan, que quedan tal cual.
