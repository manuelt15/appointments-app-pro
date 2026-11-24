import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * Guardia de semántica ARIA del loader LoadingState —
 * appointments-2026-11-07-008 (MEDIA, accesibilidad).
 *
 * El hallazgo: el contador de tiempo transcurrido re-renderea cada 100 ms
 * y vive DENTRO del div role="status" (región aria-live implícita). Diez
 * mutaciones de texto por segundo dentro de una región en vivo ahogan al
 * lector de pantalla: anuncia «0,1 s», «0,2 s»… sin parar y el anuncio
 * real de carga se pierde en el ruido.
 *
 * Resolución mínima sin perder el anuncio de carga: el contador es
 * decorativo y queda oculto al árbol accesible (aria-hidden), como ya
 * lo está la rejilla de píxeles. La región de status conserva la
 * etiqueta, que es lo único que se anuncia; el contador sigue latiendo
 * a 100 ms para quien ve la pantalla.
 *
 * Este guard se pone en rojo si el contador transcurrido vuelve a verse
 * en el árbol accesible, si el latido visual se elimina o se ralentiza,
 * si la región de status se oculta entera (se perdería el anuncio), si
 * desaparece el role="status" o si la etiqueta deja de renderizarse.
 */

interface Check {
  reason: string
  pattern: RegExp
  times: number
}

const FILE = 'components/ui/loading-state.tsx'

const SOURCE = readFileSync(FILE, 'utf8')

const CHECKS: Check[] = [
  // Lo que NO debe estar (el hallazgo -008)
  {
    reason:
      'el contador transcurrido no puede ser visible al árbol accesible: son 10 mutaciones de texto por segundo dentro de una región aria-live',
    pattern: /<span(?![^>]*aria-hidden)[^>]*>\{elapsed\}<\/span>/g,
    times: 0,
  },
  {
    reason: 'la región de status no se oculta entera: se perdería el anuncio de carga',
    pattern: /<div(?=[^>]*role="status")[^>]*aria-hidden|<div(?=[^>]*aria-hidden)[^>]*role="status"/g,
    times: 0,
  },

  // Lo que SÍ debe estar (el patrón válido que lo sustituye)
  {
    reason: 'el loader sigue anunciándose: un único contenedor div role="status"',
    pattern: /<div\s+role="status"/g,
    times: 1,
  },
  {
    reason: 'la etiqueta sigue renderizada como texto de un span: es el anuncio de carga',
    pattern: /\{label\}\s*<\/span>/g,
    times: 1,
  },
  {
    reason: 'el contador sigue latiendo a 100 ms para quien ve la pantalla',
    pattern: /\(current\) => current \+ 1\), 100\)/g,
    times: 1,
  },
  {
    reason: 'el contador queda oculto al árbol accesible con aria-hidden',
    pattern: /<span\s+aria-hidden\s+className="font-mono[^"]*"\s*>\{elapsed\}<\/span>/g,
    times: 1,
  },
]

describe('guardia de roles ARIA del loader LoadingState (appointments-2026-11-07-008)', () => {
  it.each(CHECKS)('$reason', (check) => {
    const matches = SOURCE.match(check.pattern)
    expect(
      matches?.length ?? 0,
      `${FILE}: el patrón debe aparecer ${check.times} vez/veces`,
    ).toBe(check.times)
  })
})
