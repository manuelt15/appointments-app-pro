import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { format } from 'date-fns'

const PAGE = { width: 595, height: 842 } // A4 portrait
const MARGIN = 40
const ROW_HEIGHT = 18
const TEXT_SIZE = 8.5

const INK = rgb(0.09, 0.09, 0.09)
const SOFT = rgb(0.45, 0.45, 0.45)
const LINE = rgb(0.88, 0.88, 0.88)

export interface HistoryPdfInput {
  businessName: string
  monthLabel: string
  filters: string[]
  summary: { label: string; value: string }[]
  employees: { name: string; color: string; shifts: number; hours: string; days: number; absences: number }[]
  entries: { date: string; employee: string; time: string; hours: string; type: string; notes: string }[]
}

interface Column {
  label: string
  width: number
  align?: 'right'
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const value = Number.parseInt(full, 16)
  if (Number.isNaN(value) || full.length !== 6) return rgb(0.4, 0.4, 0.4)
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255)
}

/** Standard fonts only encode WinAnsi; anything else (emoji, CJK) would make pdf-lib throw. */
function encodable(text: string) {
  return text.replace(/[^\x20-\x7E -ÿ–—‘’“”…€]/g, '?')
}

function fit(text: string, font: PDFFont, size: number, width: number) {
  let value = encodable(text)
  if (font.widthOfTextAtSize(value, size) <= width) return value
  while (value.length > 1 && font.widthOfTextAtSize(`${value}…`, size) > width) value = value.slice(0, -1)
  return `${value}…`
}

export async function buildHistoryPdf(input: HistoryPdfInput) {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const contentWidth = PAGE.width - MARGIN * 2

  let page: PDFPage = pdf.addPage([PAGE.width, PAGE.height])
  let cursor = PAGE.height - MARGIN

  function newPage() {
    page = pdf.addPage([PAGE.width, PAGE.height])
    cursor = PAGE.height - MARGIN
  }

  function text(value: string, x: number, y: number, options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; width?: number; align?: 'right' } = {}) {
    const size = options.size ?? TEXT_SIZE
    const usedFont = options.font ?? font
    const content = options.width ? fit(value, usedFont, size, options.width) : encodable(value)
    const left = options.align === 'right' && options.width
      ? x + options.width - usedFont.widthOfTextAtSize(content, size)
      : x
    page.drawText(content, { x: left, y, size, font: usedFont, color: options.color ?? INK })
  }

  function rule(y: number, thickness = 0.5) {
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE.width - MARGIN, y }, thickness, color: LINE })
  }

  function heading(title: string) {
    if (cursor - 40 < MARGIN) newPage()
    else cursor -= 22
    text(title, MARGIN, cursor, { size: 11, font: bold })
    cursor -= 14
  }

  function table(columns: Column[], rows: string[][], dots?: string[]) {
    function header() {
      let x = MARGIN
      for (const column of columns) {
        text(column.label, x + 4, cursor - 12, { size: 7.5, color: SOFT, width: column.width - 8, align: column.align })
        x += column.width
      }
      cursor -= ROW_HEIGHT
      rule(cursor, 0.8)
    }

    header()
    rows.forEach((row, rowIndex) => {
      if (cursor - ROW_HEIGHT < MARGIN) {
        newPage()
        header()
      }
      let x = MARGIN
      row.forEach((cell, index) => {
        const column = columns[index]
        const dot = index === 0 && dots?.[rowIndex]
        if (dot) page.drawCircle({ x: x + 7, y: cursor - 9.5, size: 2.8, color: hexToRgb(dot) })
        const offset = dot ? 14 : 4
        text(cell, x + offset, cursor - 12, { width: column.width - offset - 4, align: column.align })
        x += column.width
      })
      cursor -= ROW_HEIGHT
      rule(cursor)
    })
  }

  // Title block
  text(input.businessName, MARGIN, cursor - 12, { size: 16, font: bold, width: contentWidth })
  cursor -= 30
  text(`History · ${input.monthLabel}`, MARGIN, cursor, { size: 11, color: SOFT })
  cursor -= 14
  text(input.filters.join('  ·  '), MARGIN, cursor, { size: 8, color: SOFT, width: contentWidth })
  cursor -= 16

  // Summary tiles
  const gap = 8
  const tileWidth = (contentWidth - gap * (input.summary.length - 1)) / input.summary.length
  input.summary.forEach((tile, index) => {
    const x = MARGIN + index * (tileWidth + gap)
    page.drawRectangle({ x, y: cursor - 46, width: tileWidth, height: 46, borderColor: LINE, borderWidth: 0.8 })
    text(tile.label, x + 8, cursor - 14, { size: 7.5, color: SOFT, width: tileWidth - 16 })
    text(tile.value, x + 8, cursor - 36, { size: 15, font: bold, width: tileWidth - 16 })
  })
  cursor -= 62

  heading('By employee')
  if (input.employees.length === 0) {
    text('Nobody worked in this month.', MARGIN, cursor - 12, { color: SOFT })
    cursor -= ROW_HEIGHT
  } else {
    table(
      [
        { label: 'Employee', width: contentWidth - 4 * 80 },
        { label: 'Shifts', width: 80, align: 'right' },
        { label: 'Hours', width: 80, align: 'right' },
        { label: 'Days worked', width: 80, align: 'right' },
        { label: 'Absences', width: 80, align: 'right' },
      ],
      input.employees.map((row) => [row.name, String(row.shifts), row.hours, String(row.days), String(row.absences)]),
      input.employees.map((row) => row.color)
    )
  }

  heading(`All entries (${input.entries.length})`)
  if (input.entries.length === 0) {
    text('No entries in this month.', MARGIN, cursor - 12, { color: SOFT })
  } else {
    table(
      [
        { label: 'Date', width: 72 },
        { label: 'Employee', width: 112 },
        { label: 'Time', width: 92 },
        { label: 'Hours', width: 44, align: 'right' },
        { label: 'Type', width: 66 },
        { label: 'Notes', width: contentWidth - 386 },
      ],
      input.entries.map((entry) => [entry.date, entry.employee, entry.time, entry.hours, entry.type, entry.notes])
    )
  }

  const generated = `Generated ${format(new Date(), 'd MMM yyyy HH:mm')}`
  const pages = pdf.getPages()
  pages.forEach((current, index) => {
    current.drawText(generated, { x: MARGIN, y: MARGIN - 18, size: 7.5, font, color: SOFT })
    const label = `${index + 1} / ${pages.length}`
    current.drawText(label, {
      x: PAGE.width - MARGIN - font.widthOfTextAtSize(label, 7.5), y: MARGIN - 18, size: 7.5, font, color: SOFT,
    })
  })

  return pdf.save()
}
