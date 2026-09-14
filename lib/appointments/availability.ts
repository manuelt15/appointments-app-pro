import { z } from 'zod'
import { isValidTimeRange } from './validation'

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid resource ID')

export const AvailabilityQuerySchema = z.object({
  calendar_id: objectId.optional(),
  employee_id: objectId.optional(),
  room_id: objectId.optional(),
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }),
}).refine(
  ({ calendar_id, employee_id, room_id }) =>
    [calendar_id, employee_id, room_id].filter(Boolean).length === 1,
  { message: 'Provide exactly one of calendar_id, employee_id, or room_id' }
).refine(
  ({ start_time, end_time }) => isValidTimeRange(start_time, end_time),
  { message: 'End time must be after start time', path: ['end_time'] }
)

export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>

export function buildCalendarLookup(query: AvailabilityQuery, businessId: string) {
  return {
    businessId,
    isActive: true,
    ...(query.calendar_id && { _id: query.calendar_id }),
    ...(query.employee_id && { employeeId: query.employee_id }),
    ...(query.room_id && { roomId: query.room_id }),
  }
}
