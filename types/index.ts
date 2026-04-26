export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

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
  color: string
  isActive: boolean
  createdAt: string
}

export interface Room {
  _id: string
  businessId: string
  name: string
  capacity: number
  color: string
  isActive: boolean
  createdAt: string
}

export interface Calendar {
  _id: string
  businessId: string
  name: string
  employeeId?: string
  roomId?: string
  isActive: boolean
  createdAt: string
  employee?: Employee
  room?: Room
}

export interface Appointment {
  _id: string
  businessId: string
  calendarId: string
  employeeId?: string
  roomId?: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  clientNotes?: string
  title: string
  description?: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  calendar?: Calendar
  employee?: Employee
  room?: Room
}

export interface ApiKey {
  _id: string
  businessId: string
  name: string
  lastUsedAt?: string
  expiresAt?: string
  createdAt: string
}
