import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import type { Employee, Shift } from '../../types'

vi.mock('@/lib/design/readable-foreground', async () => import('../../lib/design/readable-foreground'))
vi.mock('@/lib/shifts/calendar-date', async () => import('../../lib/shifts/calendar-date'))
vi.mock('@/lib/shifts/matrix', async () => import('../../lib/shifts/matrix'))
vi.mock('@/lib/utils', async () => import('../../lib/utils'))
import WeekMatrix from './WeekMatrix'

it('renders a week caption and scoped column and row headers (021)', () => {
  const html = renderToStaticMarkup(createElement(WeekMatrix, {
    date: new Date(2026, 10, 2),
    employees: [{ _id: 'employee-1', fullName: 'Test Employee', color: '#0070f3' } as Employee],
    shifts: [], onSelectShift: () => {}, onSelectCell: () => {},
  }))
  expect(html).toMatch(/<caption[^>]*>Weekly schedule: 2 Nov – 8 Nov 2026<\/caption>/)
  const header = html.match(/<thead>([\s\S]*?)<\/thead>/)![1]
  const columns = [...header.matchAll(/<th\b[^>]*>/g)]
  expect(columns).toHaveLength(8)
  for (const column of columns) expect(column[0]).toContain('scope="col"')
  expect(html).toMatch(/<th scope="row"/)
})

it('distinguishes identical shift times by employee while keeping time and notes (022)', () => {
  const employees = ['Alice Test', 'Bob Test'].map((fullName, i) => ({
    _id: String(i), fullName, color: '#0070f3',
  } as Employee))
  const html = renderToStaticMarkup(createElement(WeekMatrix, {
    date: new Date(2026, 10, 2), employees,
    shifts: employees.map((employee) => ({
      shift: { _id: employee._id, employeeId: employee._id, type: 'shift', notes: 'Front desk' } as Shift,
      start: new Date(2026, 10, 2, 9), end: new Date(2026, 10, 2, 17),
    })),
    onSelectShift: () => {}, onSelectCell: () => {},
  }))
  const buttons = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)]
    .map(([button]) => button).filter((button) => button.includes('Front desk'))
  expect(buttons).toHaveLength(2)
  for (const [i, button] of buttons.entries()) {
    expect(button).toContain(`<span class="sr-only">${employees[i].fullName} on 2 November: </span>`)
    expect(button).toContain('09:00 – 17:00')
    expect(button).toContain('Front desk')
  }
})
