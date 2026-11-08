import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { ColorPicker } from './color-picker'

it('names every employee color and exposes the selected radio (024)', () => {
  const source = readFileSync('components/employees/EmployeeForm.tsx', 'utf8')
  const colors = [...source.match(/EMPLOYEE_COLORS = \[([^\]]+)\]/)![1].matchAll(/'([^']+)'/g)].map((match) => match[1])
  const names = ['Indigo', 'Blue', 'Emerald', 'Amber', 'Red', 'Purple', 'Pink', 'Teal']
  expect(colors).toHaveLength(names.length)
  for (const selected of colors) {
    const html = renderToStaticMarkup(createElement(ColorPicker, {
      colors, value: selected, onChange: () => {}, label: 'Employee color',
    }))
    const radios = [...html.matchAll(/<button[^>]*role="radio"[^>]*>/g)].map(([button]) => button)
    expect(radios).toHaveLength(names.length)
    radios.forEach((radio, i) => {
      expect(radio).toContain(`aria-label="Employee color: ${names[i]}"`)
      expect(radio).toContain(`aria-checked="${colors[i] === selected}"`)
      expect(radio).not.toMatch(/aria-label="[^\"]*#/)
    })
  }
})
