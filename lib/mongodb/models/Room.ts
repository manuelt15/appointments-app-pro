import { Schema, model, models } from 'mongoose'

const RoomSchema = new Schema({
  businessId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  capacity: { type: Number, required: true, default: 1 },
  color: { type: String, required: true, default: '#10b981' },
  isActive: { type: Boolean, required: true, default: true },
}, { timestamps: true })

export const Room = models.Room ?? model('Room', RoomSchema)
