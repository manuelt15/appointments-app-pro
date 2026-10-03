import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { buildHistoryPdf, type HistoryPdfInput } from './history-pdf'

const base: HistoryPdfInput = {
  businessName: 'Shift SL',
  monthLabel: 'September 2026',
  filters: ['All employees', 'All types', 'Only employees who worked'],
  summary: [
    { label: 'Hours worked', value: '50 h' },
    { label: 'Shifts', value: '6' },
    { label: 'Employees who worked', value: '2' },
    { label: 'Absences', value: '5' },
  ],
  employees: [{ name: 'Lucía Muñoz', color: '#7928ca', shifts: 4, hours: '32 h', days: 4, absences: 3 }],
  entries: [],
}

async function pageCount(bytes: Uint8Array) {
  return (await PDFDocument.load(bytes)).getPageCount()
}

describe('history pdf', () => {
  it('builds a one-page document for an empty month', async () => {
    expect(await pageCount(await buildHistoryPdf({ ...base, employees: [] }))).toBe(1)
  })

  it('spills long entry lists onto more pages', async () => {
    const entries = Array.from({ length: 120 }, (_, index) => ({
      date: `Mon ${index} Sep`,
      employee: 'Lucía Muñoz',
      time: '09:00 – 17:00',
      hours: '8 h',
      type: 'Shift',
      notes: '',
    }))
    expect(await pageCount(await buildHistoryPdf({ ...base, entries }))).toBeGreaterThan(2)
  })

  it('does not fail on characters the standard font cannot encode', async () => {
    const entries = [{ date: 'Mon 14 Sep', employee: '李小龙', time: '09:00 – 17:00', hours: '8 h', type: 'Shift', notes: 'Cover 🎉' }]
    await expect(buildHistoryPdf({ ...base, entries })).resolves.toBeInstanceOf(Uint8Array)
  })
})
