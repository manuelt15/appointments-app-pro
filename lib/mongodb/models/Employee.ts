import { Schema, model, models, type UpdateWithAggregationPipeline } from 'mongoose'

const EmployeeSchema = new Schema({
  businessId: { type: String, required: true, index: true },
  userId: { type: String },
  fullName: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  // Calendar dates as plain YYYY-MM-DD: no timezone can shift them a day.
  birthday: { type: String },
  startDate: { type: String },
  color: { type: String, required: true, default: '#6366f1' },
  isActive: { type: Boolean, required: true, default: true },
  // Set the moment the employee is deleted, when email, phone and birthday have
  // already been cleared. NULL means the row still holds the personal data.
  anonymizedAt: { type: Date, default: null },
}, { timestamps: true })

/**
 * Personal data a deactivated employee no longer needs. RGPD art. 5.1.c
 * (minimisation) and 5.1.e (storage limitation): once the person is out, keeping
 * their email, phone and birthday has no purpose left, and the phone is the field
 * most likely to belong to someone who never signed up for this app.
 */
export const EMPLOYEE_PERSONAL_FIELDS = ['email', 'phone', 'birthday'] as const

/**
 * Update stage for the logical delete.
 *
 * The row is NOT removed: past shifts point at it through `employeeId`, and the
 * calendar and the PDFs must keep showing who worked those days. So what stays is
 * what history needs (id, fullName, color, businessId, startDate and the
 * createdAt/updatedAt marks) and what goes is the personal data with no purpose
 * left (email, phone, birthday). `anonymizedAt` records that the row was purged.
 *
 * Consequence, on purpose: a purged employee has no address, so the weekly email
 * preparation skips them with "No email address" instead of writing to someone
 * who is no longer there.
 *
 * `$ifNull` keeps the first timestamp: deleting an already deleted employee does
 * not rewrite when it was anonymised, so the call is idempotent.
 */
export function buildEmployeeAnonymization(now: Date = new Date()): UpdateWithAggregationPipeline {
  return [
    {
      $set: {
        isActive: false,
        email: null,
        phone: null,
        birthday: null,
        anonymizedAt: { $ifNull: ['$anonymizedAt', now] },
      },
    },
  ]
}

export const Employee = models.Employee ?? model('Employee', EmployeeSchema)
