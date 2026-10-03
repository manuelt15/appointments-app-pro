import moment from 'moment-timezone'
import { auth } from '@/auth'
import ScheduleHistory, { type HistoryEmployee } from '@/components/history/ScheduleHistory'
import { connectDB } from '@/lib/mongodb/client'
import { Business } from '@/lib/mongodb/models/Business'
import { Employee } from '@/lib/mongodb/models/Employee'

interface HistoryBusiness {
  _id: { toString(): string }
  name: string
  timezone: string
}

interface EmployeeRecord {
  _id: { toString(): string }
  fullName: string
  color: string
  isActive: boolean
}

export default async function HistoryPage() {
  const session = await auth()
  await connectDB()
  const business = await Business.findOne({ ownerId: session!.user!.id })
    .select('_id name timezone')
    .lean<HistoryBusiness>()
  const timeZone = business?.timezone ?? 'Europe/Madrid'

  // Inactive employees too: their old shifts still need a name.
  const records = await Employee.find({ businessId: business?._id.toString() })
    .select('fullName color isActive')
    .sort({ fullName: 1 })
    .lean<EmployeeRecord[]>()
  const employees: HistoryEmployee[] = records.map((record) => ({
    _id: record._id.toString(),
    fullName: record.fullName,
    color: record.color,
    isActive: record.isActive,
  }))

  const now = moment().tz(timeZone)

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b bg-card px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">History</h1>
        <p className="text-sm text-body">Every month of the schedule: who worked, for how long, and who was away.</p>
      </header>
      <div className="flex-1 p-4 sm:p-6">
        <ScheduleHistory
          businessName={business?.name ?? 'Schedule'}
          timeZone={timeZone}
          employees={employees}
          currentYear={now.year()}
          currentMonth={now.month()}
        />
      </div>
    </div>
  )
}
