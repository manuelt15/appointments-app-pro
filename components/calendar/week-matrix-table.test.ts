import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import type { Employee } from '../../types'

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
