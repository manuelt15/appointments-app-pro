import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { t } from '@/lib/i18n/translate'

const source = readFileSync('app/(main)/home/page.tsx', 'utf8')
const emptyCell = source.split('day.entries.length === 0 ? (')[1]?.split(') : (')[0] ?? ''

// Guardia de fuente de appointments-2026-11-07-016, no prueba de lector de pantalla.
describe('texto accesible de las celdas vacías de Home', () => {
  it('no intenta nombrar un span genérico mediante aria-label', () => {
    expect(emptyCell).not.toContain('aria-label=')
  })

  it('conserva el guion visual sin duplicarlo en el árbol accesible', () => {
    expect(emptyCell).toContain('<span aria-hidden="true">–</span>')
  })

  it('expone la alternativa como texto real, traducida por el diccionario', () => {
    expect(emptyCell).toContain(`<span className="sr-only">{t(locale, 'home.emptyCell')}</span>`)
    // La clave existe en los dos idiomas: sin ella el sr-only quedaría mudo.
    expect(t('en', 'home.emptyCell')).toBe('Nothing')
    expect(t('es', 'home.emptyCell')).toBe('Nada')
  })
})
