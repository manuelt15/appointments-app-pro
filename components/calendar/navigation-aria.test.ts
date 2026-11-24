import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { t } from '@/lib/i18n/translate'

const source = readFileSync('components/calendar/ShiftCalendar.tsx', 'utf8')

// The label follows the active view, so each arrow carries two names. Both come from
// the dictionary now, so the guard compares the expression with the keys and then
// checks that each key really resolves in English instead of echoing itself.
describe('calendar destination labels (appointments-2026-11-07-019)', () => {
  it.each([
    { direction: -1, monthKey: 'calendar.previousMonth', weekKey: 'calendar.previousWeek' },
    { direction: 1, monthKey: 'calendar.nextMonth', weekKey: 'calendar.nextWeek' },
  ])('labels navigation $direction according to the active view', ({ direction, monthKey, weekKey }) => {
    const button = source.split('<Button').find((part) => part.split('</Button>')[0].includes(`shiftDate(${direction})`))
    expect(button).toBeDefined()
    const opening = button!.split('>')[0] // guard below reads the complete expression (onClick contains =>).
    expect(opening).toContain(`aria-label={view === Views.MONTH ? t('${monthKey}') : t('${weekKey}')}`)
    expect(t('en', monthKey)).not.toBe(monthKey)
    expect(t('en', weekKey)).not.toBe(weekKey)
  })
})
