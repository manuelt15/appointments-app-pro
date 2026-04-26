import { Schema, model, models } from 'mongoose'

const ApiKeySchema = new Schema({
  businessId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  keyHash: { type: String, required: true, unique: true },
  lastUsedAt: { type: Date },
  expiresAt: { type: Date },
}, { timestamps: true })

export const ApiKey = models.ApiKey ?? model('ApiKey', ApiKeySchema)
