# Handover 2026-11-24 · Español e inglés en toda la app

## Qué se hizo

La app habla **español e inglés**, con español por defecto y un interruptor en la barra lateral.
Va entero, no a medias: menú, ajustes, alta, aviso de privacidad, inicio, calendario, empleados,
historial y los textos de turno que ve el usuario.

Commits de la tanda, en orden:

| SHA | Qué |
|---|---|
| `eab6a19` | Infraestructura: diccionarios tipados es/en, cookie, `/api/locale`, `<html lang>`, menú y controles |
| `65e6620` | Barra lateral: fuera la etiqueta «Negocio» y radios de los controles como el resto de la app |
| `937a249` | Traducción de ajustes, login, registro, aviso de privacidad y aceptación (165 claves) |
| `087fe12` | Traducción del área de trabajo (226 claves) y pie del menú en el orden Ajustes, tema, idioma, usuario |

Antes, en la misma sesión: `f6e743c` (ancho de Ajustes) y `e473e3b` (clave primero, prompt del agente
con logos, manual después).

Dónde vive cada pieza:

- `lib/i18n/locales.ts`, `dictionaries/{es,en}.ts`, `translate.ts`, `rich.tsx` (negrita, código y
  cursiva dentro de una clave), `dates.ts` (date-fns es / en-GB), `request.ts` (cookie en route
  handlers), `test-locale.tsx` (helper de tests).
- Diccionarios: **416 claves por idioma**, paridad exacta y verificada.
- `app/api/locale/route.ts` cambia el idioma; cookie de un año, HttpOnly, SameSite=Lax, Secure en
  producción.
- Controles: `components/layout/{SegmentedControl,ThemeControl,LanguageControl}.tsx`.

## Cómo se verificó

```
npx tsc --noEmit        -> 0
npx eslint .            -> 0 errores (1 aviso preexistente en lib/schedule/email.ts)
npx vitest run          -> 478 passed | 6 skipped
next build              -> 0
paridad diccionarios    -> 416 / 416, ninguna clave de más en ningún lado
```

En producción, `087fe12` desplegado en success:

```
/login 200 lang="es"   /privacy 200 lang="es"  («Aviso de privacidad»)
/register 200 lang="es"
con Cookie: locale=en  -> lang="en" y «Privacy notice»
```

## Trampas encontradas

- **Leer la cookie en el layout hace la app dinámica.** `/privacy`, `/login` y `/register` pasan de
  estáticas a dinámicas. Con sesión de por medio no cambia nada práctico, pero es el precio de que
  `<html lang>` sea correcto desde la primera pintura.
- **`jsdom` no está instalado.** Un test de componente con `@vitest-environment jsdom` tumba la suite
  entera con `Cannot find package 'jsdom'`. Se usa `renderToStaticMarkup` en entorno node, o el helper
  `renderInLocale`.
- **La `t` del provider cambia de identidad en cada render.** Meterla en las dependencias de un
  `useEffect` que hace fetch dispara un bucle infinito. Se calcula el texto con `translate(locale, …)`
  fuera del render y la dependencia es `locale`.
- **Los valores guardados no se traducen.** El tipo de turno sigue siendo `shift`, `vacation`,
  `sick_leave` o `time_off` en base de datos y en la API; solo cambian las etiquetas (`lib/shifts/labels.ts`).
- **El prompt del agente no se traduce.** Es un prompt para agentes y va en inglés; hay un test que
  comprueba que es idéntico byte a byte en los dos idiomas.

## Qué queda pendiente

- **El PDF del cuadrante y los correos siguen en inglés.** `TYPE_LABELS` de `lib/schedule/week.ts` lo
  usan los dos PDF y el correo del cuadrante, y quedaron fuera del alcance de la tanda. Es el
  siguiente paso natural del i18n, y hay que decidir si el PDF sale en el idioma de quien lo descarga
  o en el del negocio.
- **Previews de Vercel sin variables**, por decisión de Manuel: los previews seguirán fallando.
- **Placeholders legales** `[RESPONSABLE LEGAL]` y `[EMAIL DE CONTACTO]` siguen visibles en `/privacy`,
  y el aviso se declara borrador sin revisar por un abogado.
- **Migración de turnos con el id en mayúsculas**: comprobado en producción, no hay ninguno (17 turnos,
  0 afectados). El script queda por si aparece.
