import { z } from 'zod'
import { SHIFT_TYPES, isValidTimeRange } from './validation'

const objectId = z.string().regex(/^[a-f\d]{24}$/i)

export const ShiftListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  employee_id: objectId.optional(),
  type: z.enum(SHIFT_TYPES).optional(),
  start: z.string().datetime({ offset: true }).optional(),
  end: z.string().datetime({ offset: true }).optional(),
}).refine(
  ({ start, end }) => !start || !end || isValidTimeRange(start, end),
  { message: 'End must be after start', path: ['end'] }
)

export type ShiftListQuery = z.infer<typeof ShiftListQuerySchema>

export function buildShiftListFilter(query: ShiftListQuery, businessId: string) {
  const filter: Record<string, unknown> = { businessId }

  if (query.employee_id) filter.employeeId = query.employee_id
  if (query.type) filter.type = query.type
  if (query.start) filter.endTime = { $gt: new Date(query.start) }
  if (query.end) filter.startTime = { $lt: new Date(query.end) }

  return filter
}
