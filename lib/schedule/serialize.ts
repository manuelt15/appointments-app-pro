import type { Employee, Shift } from '@/types'

/**
 * Mongoose `.lean()` hands back ObjectId for _id and Date for dates, even when
 * the call is typed as the plain interface. Anything crossing from the database
 * into shared logic goes through here, or `===` against a string id silently
 * never matches.
 */
export function toPlainEmployee(raw: Record<string, unknown>): Employee {
  return {
    ...(raw as unknown as Employee),
    _id: String(raw._id),
  }
}

export function toPlainShift(raw: Record<string, unknown>): Shift {
  return {
    ...(raw as unknown as Shift),
    _id: String(raw._id),
    employeeId: String(raw.employeeId),
    startTime: new Date(raw.startTime as string | Date).toISOString(),
    endTime: new Date(raw.endTime as string | Date).toISOString(),
  }
}
