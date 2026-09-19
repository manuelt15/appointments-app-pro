interface ConflictFilterInput {
  businessId: string
  employeeId: string
  startTime: string | Date
  endTime: string | Date
  excludeShiftId?: string
}

export function buildConflictFilter({
  businessId,
  employeeId,
  startTime,
  endTime,
  excludeShiftId,
}: ConflictFilterInput) {
  return {
    ...(excludeShiftId ? { _id: { $ne: excludeShiftId } } : {}),
    businessId,
    employeeId,
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) },
  }
}
