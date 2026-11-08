import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync('components/calendar/ShiftCalendar.tsx', 'utf8')

describe('calendar destination labels (appointments-2026-11-07-019)', () => {
  it.each([
    { direction: -1, month: 'Previous month', week: 'Previous week' },
    { direction: 1, month: 'Next month', week: 'Next week' },
  ])('labels navigation $direction according to the active view', ({ direction, month, week }) => {
    const button = source.split('<Button').find((part) => part.split('</Button>')[0].includes(`shiftDate(${direction})`))
    expect(button).toBeDefined()
    const opening = button!.split('>')[0] // guard below reads the complete expression (onClick contains =>).
    expect(opening).toContain(`aria-label={view === Views.MONTH ? '${month}' : '${week}'}`)
  })
})
