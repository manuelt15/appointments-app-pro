import { describe, it, expect } from 'vitest'
import { EMAIL_COLLATION, normalizeEmail, emailLookup } from './email'

describe('emailLookup', () => {
  it('normaliza el correo a minusculas y sin espacios', () => {
    expect(normalizeEmail('  Ana@Example.COM ')).toBe('ana@example.com')
  })

  it('busca por el correo normalizado con collation que ignora mayusculas', () => {
    expect(emailLookup('Ana@Example.COM')).toEqual({
      filter: { email: 'ana@example.com' },
      options: { collation: { locale: 'es', strength: 2 } },
    })
    expect(EMAIL_COLLATION.strength).toBe(2)
  })
})
