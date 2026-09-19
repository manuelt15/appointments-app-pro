import { z } from 'zod'
import { isValidTimeRange } from './validation'

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid employee ID')

export const CoverageQuerySchema = z.object({
  employee_id: objectId.optional(),
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }),
}).refine(
  ({ start_time, end_time }) => isValidTimeRange(start_time, end_time),
  { message: 'End time must be after start time', path: ['end_time'] }
)

export type CoverageQuery = z.infer<typeof CoverageQuerySchema>

/** Shifts overlapping the window: who is scheduled while it lasts. */
export function buildCoverageFilter(query: CoverageQuery, businessId: string) {
  return {
    businessId,
    ...(query.employee_id && { employeeId: query.employee_id }),
    startTime: { $lt: new Date(query.end_time) },
    endTime: { $gt: new Date(query.start_time) },
  }
}
