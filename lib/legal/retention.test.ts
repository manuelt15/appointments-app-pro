import { describe, it, expect } from 'vitest'
import { retentionCutoff, expiredShiftFilter, anonymizedEmployeeFilter } from './retention'

describe('retentionCutoff', () => {
  it('retrocede cuatro años por defecto', () => {
    expect(retentionCutoff(new Date('2026-11-25T00:00:00Z')).toISOString()).toBe(
      '2022-11-25T00:00:00.000Z',
    )
  })

  it('el corte cae en el mismo dia, no en el mismo ano natural', () => {
    // Un turno del 3 de enero de 2023 sigue dentro del plazo en enero de 2027.
    const cutoff = retentionCutoff(new Date('2027-01-03T12:00:00Z'))
    expect(cutoff.toISOString()).toBe('2023-01-03T12:00:00.000Z')
  })
})

describe('filtros de purga', () => {
  it('borra por el final del turno, no por el principio', () => {
    const cutoff = new Date('2022-11-25T00:00:00Z')
    expect(expiredShiftFilter(cutoff)).toEqual({ endTime: { $lt: cutoff } })
  })

  it('solo mira fichas ya anonimizadas', () => {
    expect(anonymizedEmployeeFilter()).toEqual({ anonymizedAt: { $ne: null } })
  })
})
