import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { expect, it, vi } from 'vitest'
import { renderInLocale } from '@/lib/i18n/test-locale'
import { t } from '@/lib/i18n/translate'
import { ColorPicker } from './color-picker'

// The colour names live in the dictionary now, so the picker is rendered inside the
// locale provider with English pinned and the expected names come from there.
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

it('names every employee color and exposes the selected radio (024)', () => {
  const source = readFileSync('components/employees/EmployeeForm.tsx', 'utf8')
  const colors = [...source.match(/EMPLOYEE_COLORS = \[([^\]]+)\]/)![1].matchAll(/'([^']+)'/g)].map((match) => match[1])
  const names = [
    t('en', 'common.color.indigo'),
    t('en', 'common.color.blue'),
    t('en', 'common.color.emerald'),
    t('en', 'common.color.amber'),
    t('en', 'common.color.red'),
    t('en', 'common.color.purple'),
    t('en', 'common.color.pink'),
    t('en', 'common.color.teal'),
  ]
  const label = t('en', 'employees.form.colorLabel')
  expect(names).toEqual(['Indigo', 'Blue', 'Emerald', 'Amber', 'Red', 'Purple', 'Pink', 'Teal'])
  expect(colors).toHaveLength(names.length)
  for (const selected of colors) {
    const html = renderInLocale('en', createElement(ColorPicker, {
      colors, value: selected, onChange: () => {}, label,
    }))
    const radios = [...html.matchAll(/<button[^>]*role="radio"[^>]*>/g)].map(([button]) => button)
    expect(radios).toHaveLength(names.length)
    radios.forEach((radio, i) => {
      expect(radio).toContain(`aria-label="${label}: ${names[i]}"`)
      expect(radio).toContain(`aria-checked="${colors[i] === selected}"`)
      expect(radio).not.toMatch(/aria-label="[^\"]*#/)
    })
  }
})
