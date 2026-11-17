import { describe, expect, it } from 'vitest'
import { employeeEmail, employeeName } from './fields'
import { prepareWeeklyEmails } from '../schedule/email'
import type { EmployeeWeek } from '../schedule/week'

/**
 * Auditoría del 2026-11-17, hallazgo 003: el email y el nombre del empleado llegaban
 * sin validar al mensaje. Con un salto de línea en el nombre se inyectaban cabeceras.
 * Si alguien vuelve a `z.string()` libre o quita `headerSafe`, esto se pone rojo.
 */
describe('campos de empleado que acaban en un correo', () => {
  it('acepta un nombre y un email normales', () => {
    expect(employeeName.parse('  Marta Ruiz  ')).toBe('Marta Ruiz')
    expect(employeeEmail.parse(' marta@ejemplo.com ')).toBe('marta@ejemplo.com')
  })

  it('rechaza saltos de línea en el nombre', () => {
    expect(employeeName.safeParse('Marta\r\nBcc: otro@ejemplo.com').success).toBe(false)
    expect(employeeName.safeParse('Marta\nBcc: otro@ejemplo.com').success).toBe(false)
  })

  it('rechaza emails que no son emails o llevan saltos de línea', () => {
    expect(employeeEmail.safeParse('no-es-un-email').success).toBe(false)
    expect(employeeEmail.safeParse('marta@ejemplo.com\r\nBcc: otro@ejemplo.com').success).toBe(false)
    expect(employeeEmail.safeParse('').success).toBe(false)
  })
})

function week(fullName: string, email: string | undefined, hasAnything = true): EmployeeWeek {
  return {
    employee: { _id: 'emp-1', fullName, email },
    hasAnything,
    hours: 8,
    days: [{ fullLabel: 'Mon 17 Nov', entries: ['09:00-17:00'] }],
  } as unknown as EmployeeWeek
}

describe('prepareWeeklyEmails sanea lo que escribe la cabecera', () => {
  it('no deja pasar saltos de línea heredados en el nombre', () => {
    const { ready } = prepareWeeklyEmails('Bar\r\nX-Injected: 1', new Date('2026-11-17'), 'Europe/Madrid', [
      week('Marta\r\nBcc: otro@ejemplo.com', 'marta@ejemplo.com'),
    ])
    expect(ready).toHaveLength(1)
    expect(ready[0].employeeName).toBe('Marta Bcc: otro@ejemplo.com')
    expect(ready[0].body).toContain('Hi Marta Bcc: otro@ejemplo.com,')
    expect(ready[0].body).toContain('at Bar X-Injected: 1 for')
    expect(ready[0].body).not.toContain('\r')
    expect(ready[0].subject).not.toContain('\n')
  })

  it('descarta un empleado con un email heredado inválido', () => {
    const { ready, skipped } = prepareWeeklyEmails('Bar', new Date('2026-11-17'), 'Europe/Madrid', [
      week('Marta', 'inventado'),
    ])
    expect(ready).toHaveLength(0)
    expect(skipped).toEqual([{ employeeName: 'Marta', reason: 'Invalid email address' }])
  })

  it('sigue distinguiendo al que no tiene email del que lo tiene mal', () => {
    const { skipped } = prepareWeeklyEmails('Bar', new Date('2026-11-17'), 'Europe/Madrid', [
      week('Sin correo', undefined),
      week('Con correo roto', 'arroba@'),
    ])
    expect(skipped.map(s => s.reason)).toEqual(['No email address', 'Invalid email address'])
  })
})
