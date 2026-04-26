import { Schema, model, models } from 'mongoose'

const EmployeeSchema = new Schema({
  businessId: { type: String, required: true, index: true },
  userId: { type: String },
  fullName: { type: String, required: true },
  email: { type: String },
  color: { type: String, required: true, default: '#6366f1' },
  isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true })

export const Employee = models.Employee ?? model('Employee', EmployeeSchema)
