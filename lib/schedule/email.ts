import type { EmployeeWeek } from './week'
import { weekRangeLabel } from './week'
import { employeeEmail } from '../employees/fields'

/**
 * El nombre y el negocio acaban en el asunto y en el cuerpo del mensaje. Un salto
 * de línea ahí parte la cabecera en dos, así que se colapsa a un espacio: el
 * formulario ya lo rechaza, esto cubre los datos que ya están en la base.
 */
function headerSafe(value: string): string {
  return value.replace(/[\r\n\u0000]+/g, ' ').trim()
}

export interface PreparedEmail {
  employeeId: string
  employeeName: string
  to: string
  subject: string
  body: string
}

export interface EmailPreparation {
  ready: PreparedEmail[]
  skipped: { employeeName: string; reason: string }[]
}

/**
 * Builds one message per employee from their own week. Kept separate from
 * delivery so plugging a provider in later touches only `sendEmail`.
 */
export function prepareWeeklyEmails(
  businessName: string,
  weekStart: Date,
  timeZone: string,
  weeks: EmployeeWeek[]
): EmailPreparation {
  const ready: PreparedEmail[] = []
  const skipped: { employeeName: string; reason: string }[] = []

  for (const week of weeks) {
    const safeName = headerSafe(week.employee.fullName)
    const rawEmail = week.employee.email?.trim()
    if (!rawEmail) {
      skipped.push({ employeeName: safeName, reason: 'No email address' })
      continue
    }
    // Empleados antiguos con un email inventado: no se les escribe, se avisa.
    const parsedEmail = employeeEmail.safeParse(rawEmail)
    if (!parsedEmail.success) {
      skipped.push({ employeeName: safeName, reason: 'Invalid email address' })
      continue
    }
    if (!week.hasAnything) {
      skipped.push({ employeeName: safeName, reason: 'Nothing scheduled' })
      continue
    }

    const lines = week.days.map((day) => {
      const what = day.entries.length > 0 ? day.entries.join(', ') : 'Off'
      return `${day.fullLabel}: ${what}`
    })

    ready.push({
      employeeId: week.employee._id,
      employeeName: safeName,
      to: parsedEmail.data,
      subject: `Your schedule for ${weekRangeLabel(weekStart, timeZone)}`,
      body: [
        `Hi ${safeName},`,
        '',
        `Here is your schedule at ${headerSafe(businessName)} for ${weekRangeLabel(weekStart, timeZone)}.`,
        '',
        ...lines,
        '',
        `Total: ${week.hours} hours.`,
      ].join('\n'),
    })
  }

  return { ready, skipped }
}

export class EmailProviderNotConfigured extends Error {
  constructor() {
    super('No email provider is configured yet.')
    this.name = 'EmailProviderNotConfigured'
  }
}

/**
 * The single seam where a provider goes. Wire Resend or SMTP here and the
 * button starts delivering with no other change.
 */
export async function sendEmail(_message: PreparedEmail): Promise<void> {
  throw new EmailProviderNotConfigured()
}

export function isEmailConfigured() {
  return false
}
