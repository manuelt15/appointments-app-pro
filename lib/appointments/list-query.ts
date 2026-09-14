import { z } from 'zod'
import { APPOINTMENT_STATUSES, isValidTimeRange } from './validation'

const objectId = z.string().regex(/^[a-f\d]{24}$/i)

export const AppointmentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  calendar_id: objectId.optional(),
  employee_id: objectId.optional(),
  room_id: objectId.optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  start: z.string().datetime({ offset: true }).optional(),
  end: z.string().datetime({ offset: true }).optional(),
}).refine(
  ({ start, end }) => !start || !end || isValidTimeRange(start, end),
  { message: 'End must be after start', path: ['end'] }
)

export type AppointmentListQuery = z.infer<typeof AppointmentListQuerySchema>

export function buildAppointmentListFilter(query: AppointmentListQuery, businessId: string) {
  const filter: Record<string, unknown> = { businessId }

  if (query.calendar_id) filter.calendarId = query.calendar_id
  if (query.employee_id) filter.employeeId = query.employee_id
  if (query.room_id) filter.roomId = query.room_id
  if (query.status) filter.status = query.status
  if (query.start) filter.endTime = { $gt: new Date(query.start) }
  if (query.end) filter.startTime = { $lt: new Date(query.end) }

  return filter
}
