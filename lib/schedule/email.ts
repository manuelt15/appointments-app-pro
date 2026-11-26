import type { EmployeeWeek } from './week'
import { weekRangeLabel } from './week'
import { employeeEmail } from '../employees/fields'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales'
import { t } from '@/lib/i18n/translate'

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
 *
 * Todo el texto sale del diccionario en `locale`, el mismo que usan los PDF.
 * Sin locale se usa el idioma por defecto de la app: una tarea sin sesión no
 * tiene cookie de idioma y el correo sale en español.
 */
export function prepareWeeklyEmails(
  businessName: string,
  weekStart: Date,
  timeZone: string,
  weeks: EmployeeWeek[],
  locale: Locale = DEFAULT_LOCALE
): EmailPreparation {
  const ready: PreparedEmail[] = []
  const skipped: { employeeName: string; reason: string }[] = []
  const range = weekRangeLabel(weekStart, timeZone, locale)

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
      const what = day.entries.length > 0 ? day.entries.join(', ') : t(locale, 'email.schedule.off')
      return `${day.fullLabel}: ${what}`
    })

    ready.push({
      employeeId: week.employee._id,
      employeeName: safeName,
      to: parsedEmail.data,
      subject: t(locale, 'email.schedule.subject', { range }),
      body: [
        t(locale, 'email.schedule.greeting', { name: safeName }),
        '',
        t(locale, 'email.schedule.intro', { business: headerSafe(businessName), range }),
        '',
        ...lines,
        '',
        t(locale, 'email.schedule.total', { hours: week.hours }),
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
