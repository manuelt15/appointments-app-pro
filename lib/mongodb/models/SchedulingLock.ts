import { Schema, model, models } from 'mongoose'

const SchedulingLockSchema = new Schema({
  key: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { versionKey: false })

SchedulingLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const SchedulingLock = models.SchedulingLock ?? model('SchedulingLock', SchedulingLockSchema)
