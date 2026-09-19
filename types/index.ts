export type ShiftType = 'shift' | 'vacation' | 'sick_leave' | 'time_off'

export interface Business {
  _id: string
  ownerId: string
  name: string
  slug: string
  timezone: string
  createdAt: string
}

export interface Employee {
  _id: string
  businessId: string
  userId?: string
  fullName: string
  email?: string
  phone?: string
  /** Plain YYYY-MM-DD. */
  birthday?: string
  /** Plain YYYY-MM-DD. */
  startDate?: string
  color: string
  isActive: boolean
  createdAt: string
}

export interface Shift {
  _id: string
  businessId: string
  employeeId: string
  startTime: string
  endTime: string
  type: ShiftType
  notes?: string
  createdAt: string
  updatedAt: string
  employee?: Employee
}

export interface ApiKey {
  _id: string
  businessId: string
  name: string
  lastUsedAt?: string
  expiresAt?: string
  createdAt: string
}
