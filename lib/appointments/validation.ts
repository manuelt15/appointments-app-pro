import { z } from 'zod'

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
] as const

export function isValidTimeRange(startTime: string | Date, endTime: string | Date) {
  return new Date(endTime).getTime() > new Date(startTime).getTime()
}

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid calendar ID')

const appointmentFields = {
  title: z.string().min(1),
  clientName: z.string().min(1),
  clientEmail: z.email().optional().nullable(),
  clientPhone: z.string().optional().nullable(),
  clientNotes: z.string().optional().nullable(),
  calendarId: objectId,
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  description: z.string().optional().nullable(),
  status: z.enum(APPOINTMENT_STATUSES),
  metadata: z.record(z.string(), z.unknown()),
}

export const CreateAppointmentSchema = z.object({
  ...appointmentFields,
  status: appointmentFields.status.default('scheduled'),
  metadata: appointmentFields.metadata.default({}),
}).refine(
  ({ startTime, endTime }) => isValidTimeRange(startTime, endTime),
  { message: 'End time must be after start time', path: ['endTime'] }
)

export const UpdateAppointmentSchema = z.object({
  title: appointmentFields.title.optional(),
  clientName: appointmentFields.clientName.optional(),
  clientEmail: appointmentFields.clientEmail,
  clientPhone: appointmentFields.clientPhone,
  clientNotes: appointmentFields.clientNotes,
  calendarId: appointmentFields.calendarId.optional(),
  startTime: appointmentFields.startTime.optional(),
  endTime: appointmentFields.endTime.optional(),
  description: appointmentFields.description,
  status: appointmentFields.status.optional(),
  metadata: appointmentFields.metadata.optional(),
}).refine(
  ({ startTime, endTime }) => !startTime || !endTime || isValidTimeRange(startTime, endTime),
  { message: 'End time must be after start time', path: ['endTime'] }
)
