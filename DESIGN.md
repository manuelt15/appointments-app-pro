# Shift App — Geist Design System

Esta guía adapta el sistema Geist de Vercel a una aplicación de planificación de turnos. Es la fuente visual del proyecto y sustituye al sistema Apple anterior.

## Principios

- Sustracción: la interfaz debe sentirse precisa, silenciosa y funcional.
- El canvas casi blanco y la tinta casi negra llevan todo el peso visual.
- El color se reserva para enlaces, foco, estados semánticos y datos del calendario.
- Las superficies se separan con hairlines antes que con sombras.
- En producto, botones e inputs usan radio de 6px; las pills quedan reservadas a marketing.
- Toda interacción debe funcionar con teclado, lector de pantalla y touch.

## Tokens

### Color

- `background` / canvas: `#fafafa`
- `card`, `popover` / elevado: `#ffffff`
- `foreground` / ink: `#171717`
- body: `#4d4d4d`
- muted foreground: `#8f8f8f`
- faint: `#a1a1a1`
- border/input / hairline: `#ebebeb`
- muted surface: `#f2f2f2`
- link/focus: `#0070f3`
- link pressed: `#0761d1`
- destructive: `#ee0000`
- destructive pressed: `#c50000`
- warning: `#f5a623`

Acentos decorativos, solo cuando aporten significado:
- cyan `#50e3c2`
- violet `#7928ca`
- pink `#ff0080`
- magenta `#eb367f`

Gradientes de marca, limitados a superficies promocionales o ilustraciones:
- Develop: `#007cf0` → `#00dfd8`
- Preview: `#7928ca` → `#ff0080`
- Ship: `#ff4d4d` → `#f9cb28`

## Tipografía

- UI y texto: Geist Sans, fallback Arial/sans-serif.
- Código y eyebrows técnicos: Geist Mono, fallback monospace.
- Pesos: 600 para títulos, 500 para botones/labels, 400 para cuerpo.

| Token | Tamaño | Peso | Línea | Tracking | Uso |
| --- | ---: | ---: | ---: | ---: | --- |
| display-xl | 48px | 600 | 48px | -2.4px | Marketing/hero |
| heading-lg | 32px | 600 | 40px | -1.28px | Título de página |
| heading-md | 20px | 600 | 28px | -0.4px | Sección/card |
| label-sm | 14px | 500 | 20px | -0.28px | Labels y navegación |
| mono-eyebrow | 12px | 500 | 16px | 0 | Etiquetas técnicas uppercase |
| body-lg | 16px | 400 | 24px | 0 | Introducción |
| body-md | 14px | 400 | 20px | 0 | UI por defecto |
| body-sm | 12px | 400 | 16px | Metadatos |

## Espaciado y layout

Escala de 4px: `4, 8, 12, 16, 24, 32, 40, 64, 96, 128`.

- Contenedor de aplicación centrado con gutters cómodos.
- Cards: 24–32px de padding en contenido editorial; 16–24px en UI densa.
- Mobile `≤640px`: una columna, diálogo casi full-width y controles táctiles ≥44px.
- Tablet `≥768px`: grids de dos columnas cuando haya espacio real.
- Desktop `≥1024px`: navegación completa y calendario semanal.
- Usar `dvh` para layouts que ocupan viewport.

## Forma y elevación

- App controls e inputs: 6px.
- Cards y bloques: 12px.
- Paneles grandes: 16px.
- Icon buttons: círculo solo cuando la affordance lo pida.
- Nivel 0: borde `1px #ebebeb`, sin sombra.
- Nivel 1: borde + `0 1px 1px rgb(0 0 0 / 0.04)`.
- Nivel 2 (diálogos/menús): `0 2px 2px rgb(0 0 0 / 0.04), 0 8px 16px -4px rgb(0 0 0 / 0.08)`.

## Componentes de producto

### Button

- Primario: fondo ink, texto blanco, radio 6px.
- Secundario: fondo blanco, borde hairline, texto ink.
- Destructivo: rojo semántico; nunca usar solo color para comunicar estado.
- Altura mínima táctil: 40px en desktop y 44px en móvil.
- Feedback de pulsación sutil (`scale(.97)`), 100–160ms.

### Inputs y selects

- Fondo blanco, borde hairline, radio 6px, texto de 14px.
- Foco azul visible y consistente.
- Label programáticamente asociado.
- Error visible con texto además de color.

### Cards

- Fondo blanco sobre canvas `#fafafa`.
- Borde hairline; sombra solo si la jerarquía lo necesita.
- No usar gradientes decorativos dentro del producto.

### Dialog

- Focus trap, Escape, restauración de foco y nombre accesible mediante Radix/shadcn.
- Entrada por opacidad + escala desde `.97`, máximo 200ms, ease-out.
- Salida más rápida.
- En reduced motion, eliminar desplazamiento/escala y conservar opacidad breve.

### Calendario

- El color distingue recursos o estados, no decora.
- Mantener contraste de texto AA.
- No depender solo de drag & drop: editar fecha/hora debe ser una alternativa completa.
- En móvil, priorizar día/agenda frente a semana.

## Motion

- Animar solo cuando aporta feedback, continuidad espacial o evita un cambio brusco.
- UI frecuente: sin animación o 100–200ms.
- Entradas: ease-out; movimiento en pantalla: ease-in-out; color/hover: ease.
- Animar `transform` y `opacity`, nunca `transition: all`.
- Hover solo dentro de `@media (hover: hover) and (pointer: fine)`.
- Respetar `prefers-reduced-motion`.

## Do / Don't

### Do

- Usar `#171717` para títulos y acciones principales, no negro absoluto.
- Crear estructura con canvas, espacio y hairlines.
- Mantener una jerarquía de grises deliberada.
- Usar primitives de `components/ui` antes de crear controles ad hoc.
- Diseñar primero los estados loading, vacío, error, disabled y focus.

### Don't

- No mezclar radios pill y cuadrados dentro de la UI de producto.
- No llenar superficies grandes con colores de acento.
- No apilar sombras ni introducir una segunda decoración.
- No usar placeholders como sustituto de labels.
- No confirmar éxito antes de comprobar la respuesta del servidor.
