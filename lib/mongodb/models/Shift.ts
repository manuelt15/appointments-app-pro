import { Schema, model, models } from 'mongoose'

const ShiftSchema = new Schema({
  businessId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  type: {
    type: String,
    enum: ['shift', 'vacation', 'sick_leave', 'time_off'],
    required: true,
    default: 'shift',
  },
  notes: { type: String },
}, { timestamps: true })

ShiftSchema.index({ businessId: 1, startTime: 1 })
ShiftSchema.index({ businessId: 1, employeeId: 1, startTime: 1 })

export const Shift = models.Shift ?? model('Shift', ShiftSchema)
