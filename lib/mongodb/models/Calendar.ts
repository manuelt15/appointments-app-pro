import { Schema, model, models } from 'mongoose'

const CalendarSchema = new Schema({
  businessId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  employeeId: { type: String },
  roomId: { type: String },
  isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true })

export const Calendar = models.Calendar ?? model('Calendar', CalendarSchema)
