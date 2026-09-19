import { format } from 'date-fns'
import type { EmployeeWeek } from './week'
import { weekRangeLabel } from './week'

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
  weeks: EmployeeWeek[]
): EmailPreparation {
  const ready: PreparedEmail[] = []
  const skipped: { employeeName: string; reason: string }[] = []

  for (const week of weeks) {
    if (!week.employee.email) {
      skipped.push({ employeeName: week.employee.fullName, reason: 'No email address' })
      continue
    }
    if (!week.hasAnything) {
      skipped.push({ employeeName: week.employee.fullName, reason: 'Nothing scheduled' })
      continue
    }

    const lines = week.days.map((day) => {
      const what = day.entries.length > 0 ? day.entries.join(', ') : 'Off'
      return `${format(day.day, 'EEEE d MMMM')}: ${what}`
    })

    ready.push({
      employeeId: week.employee._id,
      employeeName: week.employee.fullName,
      to: week.employee.email,
      subject: `Your schedule for ${weekRangeLabel(weekStart)}`,
      body: [
        `Hi ${week.employee.fullName},`,
        '',
        `Here is your schedule at ${businessName} for ${weekRangeLabel(weekStart)}.`,
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
