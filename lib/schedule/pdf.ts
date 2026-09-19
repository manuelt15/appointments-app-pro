import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { format } from 'date-fns'
import type { EmployeeWeek } from './week'
import { weekRangeLabel } from './week'

const PAGE = { width: 842, height: 595 } // A4 landscape
const MARGIN = 36
const NAME_COLUMN = 130
const HEADER_HEIGHT = 28
const LINE_HEIGHT = 11

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const value = Number.parseInt(full, 16)
  if (Number.isNaN(value) || full.length !== 6) return rgb(0.4, 0.4, 0.4)
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255)
}

export async function buildSchedulePdf(
  businessName: string,
  weekStart: Date,
  weeks: EmployeeWeek[]
) {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([PAGE.width, PAGE.height])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const ink = rgb(0.09, 0.09, 0.09)
  const soft = rgb(0.45, 0.45, 0.45)
  const line = rgb(0.85, 0.85, 0.85)

  page.drawText(businessName, { x: MARGIN, y: PAGE.height - MARGIN, size: 16, font: bold, color: ink })
  page.drawText(weekRangeLabel(weekStart), {
    x: MARGIN, y: PAGE.height - MARGIN - 18, size: 10, font, color: soft,
  })

  const tableTop = PAGE.height - MARGIN - 44
  const usableWidth = PAGE.width - MARGIN * 2 - NAME_COLUMN
  const dayWidth = usableWidth / 7
  const days = weeks[0]?.days ?? []

  days.forEach((day, index) => {
    page.drawText(format(day.day, 'EEE d'), {
      x: MARGIN + NAME_COLUMN + index * dayWidth + 4,
      y: tableTop - 14,
      size: 9,
      font: bold,
      color: ink,
    })
  })

  page.drawLine({
    start: { x: MARGIN, y: tableTop - HEADER_HEIGHT + 6 },
    end: { x: PAGE.width - MARGIN, y: tableTop - HEADER_HEIGHT + 6 },
    thickness: 0.8,
    color: line,
  })

  let cursor = tableTop - HEADER_HEIGHT
  const rowHeight = Math.max(
    34,
    Math.min(70, (cursor - MARGIN) / Math.max(weeks.length, 1))
  )

  for (const week of weeks) {
    const rowTop = cursor
    if (rowTop - rowHeight < MARGIN) break

    page.drawCircle({
      x: MARGIN + 5,
      y: rowTop - 11,
      size: 3.5,
      color: hexToRgb(week.employee.color),
    })
    page.drawText(week.employee.fullName, {
      x: MARGIN + 14, y: rowTop - 14, size: 9.5, font: bold, color: ink,
      maxWidth: NAME_COLUMN - 50,
    })
    page.drawText(`${week.hours}h`, {
      x: MARGIN + NAME_COLUMN - 34, y: rowTop - 14, size: 9, font, color: soft,
    })

    week.days.forEach((day, index) => {
      const x = MARGIN + NAME_COLUMN + index * dayWidth + 4
      day.entries.slice(0, 3).forEach((entry, entryIndex) => {
        page.drawText(entry, {
          x, y: rowTop - 14 - entryIndex * LINE_HEIGHT, size: 8.5, font, color: ink,
          maxWidth: dayWidth - 8,
        })
      })
      if (day.entries.length === 0) {
        page.drawText('-', { x, y: rowTop - 14, size: 8.5, font, color: line })
      }
    })

    cursor -= rowHeight
    page.drawLine({
      start: { x: MARGIN, y: cursor + 6 },
      end: { x: PAGE.width - MARGIN, y: cursor + 6 },
      thickness: 0.5,
      color: line,
    })
  }

  page.drawText(`Generated ${format(new Date(), 'd MMM yyyy HH:mm')}`, {
    x: MARGIN, y: MARGIN - 12, size: 7.5, font, color: soft,
  })

  return pdf.save()
}
