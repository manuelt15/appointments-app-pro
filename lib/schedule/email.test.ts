import { describe, expect, it } from 'vitest'
import { prepareWeeklyEmails } from './email'
import { buildEmployeeWeeks } from './week'
import type { Employee, Shift } from '@/types'

/**
 * El correo del cuadrante tiene que salir en el mismo idioma que el PDF. Si
 * alguien vuelve a fijar el inglés en `prepareWeeklyEmails` o deja de pasarle el
 * locale de la sesión, estas comprobaciones se ponen rojas.
 */
const MADRID = 'Europe/Madrid'
// Lunes 14 de septiembre de 2026, 00:00 en Madrid (CEST, UTC+2).
const weekStart = new Date('2026-09-13T22:00:00.000Z')

const ana: Employee = {
  _id: 'ana', businessId: 'b1', fullName: 'Ana', email: 'ana@ejemplo.com',
  color: '#000', isActive: true, createdAt: '',
}

function shift(partial: Partial<Shift>): Shift {
  return {
    _id: Math.random().toString(36).slice(2),
    businessId: 'b1',
    employeeId: 'ana',
    startTime: '2026-09-14T07:00:00.000Z',
    endTime: '2026-09-14T15:00:00.000Z',
    type: 'shift',
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

// Un turno el lunes y unas vacaciones del martes al jueves: así el cuerpo lleva
// horas, un tipo de turno traducido y días sin nada.
const shifts = [
  shift({}),
  shift({ type: 'vacation', startTime: '2026-09-15T00:00:00.000Z', endTime: '2026-09-17T22:00:00.000Z' }),
]

function firstEmail(locale?: 'es' | 'en') {
  const weeks = buildEmployeeWeeks([ana], shifts, weekStart, MADRID, locale)
  const { ready } = locale
    ? prepareWeeklyEmails('Bar Pepe', weekStart, MADRID, weeks, locale)
    : prepareWeeklyEmails('Bar Pepe', weekStart, MADRID, weeks)
  return ready[0]
}

describe('el correo del cuadrante sigue el idioma de la sesión', () => {
  it('en español traduce asunto, saludo, cuerpo, tipos de turno, días y meses', () => {
    const email = firstEmail('es')

    expect(email.subject).toBe('Tu horario del 14 sep - 20 sep 2026')
    expect(email.body).toContain('Hola Ana,')
    expect(email.body).toContain('Este es tu horario en Bar Pepe del 14 sep - 20 sep 2026.')
    expect(email.body).toContain('lunes 14 septiembre: 09:00 - 17:00')
    expect(email.body).toContain('martes 15 septiembre: Vacaciones')
    expect(email.body).toContain('viernes 18 septiembre: Libre')
    expect(email.body).toContain('Total: 8 horas.')
  })

  it('en español no queda ninguna etiqueta en inglés', () => {
    const email = firstEmail('es')

    expect(email.subject).not.toContain('Your schedule')
    expect(email.body).not.toContain('Hi Ana')
    expect(email.body).not.toContain('Here is your schedule')
    expect(email.body).not.toMatch(/\bOff\b/)
    expect(email.body).not.toMatch(/\bVacation\b/)
    expect(email.body).not.toMatch(/\bSeptember\b/)
    expect(email.body).not.toContain('hours')
  })

  it('en inglés mantiene el texto inglés de siempre', () => {
    const email = firstEmail('en')

    expect(email.subject).toBe('Your schedule for 14 Sep - 20 Sep 2026')
    expect(email.body).toContain('Hi Ana,')
    expect(email.body).toContain('Here is your schedule at Bar Pepe for 14 Sep - 20 Sep 2026.')
    expect(email.body).toContain('Monday 14 September: 09:00 - 17:00')
    expect(email.body).toContain('Tuesday 15 September: Vacation')
    expect(email.body).toContain('Friday 18 September: Off')
    expect(email.body).toContain('Total: 8 hours.')
  })

  it('sin locale, como en una tarea sin sesión, sale en español', () => {
    const email = firstEmail()

    expect(email.subject).toBe('Tu horario del 14 sep - 20 sep 2026')
    expect(email.body).toContain('Hola Ana,')
  })
})
