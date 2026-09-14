interface ConflictFilterInput {
  businessId: string
  calendarId: string
  startTime: string | Date
  endTime: string | Date
  excludeAppointmentId?: string
}

export function buildConflictFilter({
  businessId,
  calendarId,
  startTime,
  endTime,
  excludeAppointmentId,
}: ConflictFilterInput) {
  return {
    ...(excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {}),
    businessId,
    calendarId,
    status: { $ne: 'cancelled' },
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) },
  }
}
