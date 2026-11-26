import { describe, expect, it } from 'vitest'
import type { Employee, Shift } from '@/types'
import { buildSchedulePdf } from './pdf'
import { pageTexts } from './pdf-test-text'
import { buildEmployeeWeeks } from './week'

const MADRID = 'Europe/Madrid'
// Monday 14 September 2026, 00:00 in Madrid.
const WEEK_START = new Date('2026-09-13T22:00:00.000Z')
const BUSINESS = 'Shift SL'

function employee(index: number): Employee {
  return {
    _id: `e${index}`,
    businessId: 'b',
    fullName: `Employee ${String(index).padStart(2, '0')}`,
    color: '#7928ca',
    isActive: true,
    createdAt: '',
  }
}

const vacation: Shift = {
  _id: 'vacation',
  businessId: 'b',
  employeeId: 'e1',
  startTime: '2026-09-13T22:00:00.000Z',
  endTime: '2026-09-14T22:00:00.000Z',
  type: 'vacation',
  createdAt: '',
  updatedAt: '',
}

async function build(count: number, locale: 'es' | 'en') {
  const employees = Array.from({ length: count }, (_, index) => employee(index + 1))
  const weeks = buildEmployeeWeeks(employees, [vacation], WEEK_START, MADRID, locale)
  const bytes = await buildSchedulePdf(BUSINESS, WEEK_START, MADRID, weeks, locale)
  return pageTexts(bytes)
}

describe('schedule pdf language', () => {
  it('names shift types and days in Spanish when the locale is es', async () => {
    const [first] = await build(2, 'es')

    expect(first).toContain('Vacaciones')
    expect(first).toContain('lun 14')
    expect(first).toContain('14 sep')
    expect(first).toContain('Generado el')
    expect(first).not.toContain('Vacation')
    expect(first).not.toContain('Mon 14')
    expect(first).not.toContain('Generated')
  })

  it('names shift types and days in English when the locale is en', async () => {
    const [first] = await build(2, 'en')

    expect(first).toContain('Vacation')
    expect(first).toContain('Mon 14')
    expect(first).toContain('14 Sep')
    expect(first).toContain('Generated')
    expect(first).not.toContain('Vacaciones')
    expect(first).not.toContain('lun 14')
  })
})

describe('schedule pdf pagination', () => {
  it('uses one page when everybody fits', async () => {
    expect(await build(3, 'es')).toHaveLength(1)
  })

  it('opens a new page with the day header instead of dropping employees', async () => {
    const pages = await build(20, 'es')
    expect(pages.length).toBeGreaterThanOrEqual(2)

    // Nadie se pierde: cada empleado aparece una vez en todo el documento.
    const all = pages.join('\n')
    for (let index = 1; index <= 20; index += 1) {
      const name = `Employee ${String(index).padStart(2, '0')}`
      expect(all.split(name)).toHaveLength(2)
    }

    // La segunda página repite cabecera (negocio y días) y trae gente nueva.
    const second = pages[1]
    expect(second).toContain(BUSINESS)
    expect(second).toContain('lun 14')
    const missingFromFirst = Array.from({ length: 20 }, (_, index) => `Employee ${String(index + 1).padStart(2, '0')}`)
      .filter((name) => !pages[0].includes(name))
    expect(missingFromFirst.length).toBeGreaterThan(0)
    for (const name of missingFromFirst) expect(second).toContain(name)
  })
})
