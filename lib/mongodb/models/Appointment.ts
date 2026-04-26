import { Schema, model, models } from 'mongoose'

const AppointmentSchema = new Schema({
  businessId: { type: String, required: true, index: true },
  calendarId: { type: String, required: true, index: true },
  employeeId: { type: String },
  roomId: { type: String },
  clientName: { type: String, required: true },
  clientEmail: { type: String },
  clientPhone: { type: String },
  clientNotes: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'],
    required: true,
    default: 'scheduled',
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true })

AppointmentSchema.index({ businessId: 1, startTime: 1 })
AppointmentSchema.index({ businessId: 1, startTime: 1, endTime: 1 })

export const Appointment = models.Appointment ?? model('Appointment', AppointmentSchema)
