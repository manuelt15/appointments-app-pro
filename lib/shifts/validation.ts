import { z } from 'zod'

export const SHIFT_TYPES = [
  'shift',
  'vacation',
  'sick_leave',
  'time_off',
] as const

export function isValidTimeRange(startTime: string | Date, endTime: string | Date) {
  return new Date(endTime).getTime() > new Date(startTime).getTime()
}

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid employee ID')

/**
 * Mongo casts `_id` arguments to ObjectId and matches them case-insensitively,
 * but Shift.employeeId is a plain String: two spellings of the same id resolved
 * to the same employee while the overlap check and the scheduling lock treated
 * them as two different people. Everything stored or compared uses this
 * canonical lowercase form, taken from the resolved employee.
 */
export function canonicalEmployeeId(employeeId: string) {
  return employeeId.toLowerCase()
}

const employeeIdField = objectId.transform(canonicalEmployeeId)

const shiftFields = {
  employeeId: employeeIdField,
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  type: z.enum(SHIFT_TYPES),
  notes: z.string().optional().nullable(),
}

export const CreateShiftSchema = z.object({
  ...shiftFields,
  type: shiftFields.type.default('shift'),
}).refine(
  ({ startTime, endTime }) => isValidTimeRange(startTime, endTime),
  { message: 'End time must be after start time', path: ['endTime'] }
)

export const UpdateShiftSchema = z.object({
  employeeId: employeeIdField.optional(),
  startTime: shiftFields.startTime.optional(),
  endTime: shiftFields.endTime.optional(),
  type: shiftFields.type.optional(),
  notes: shiftFields.notes,
}).refine(
  ({ startTime, endTime }) => !startTime || !endTime || isValidTimeRange(startTime, endTime),
  { message: 'End time must be after start time', path: ['endTime'] }
)
