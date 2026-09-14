import { Schema, model, models } from 'mongoose'

const BusinessSchema = new Schema({
  ownerId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  timezone: { type: String, required: true, default: 'Europe/Madrid' },
}, { timestamps: true })

export const Business = models.Business ?? model('Business', BusinessSchema)
