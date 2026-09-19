import { auth } from '@/auth'
import ShiftCalendar from '@/components/calendar/ShiftCalendar'
import { connectDB } from '@/lib/mongodb/client'
import { Business } from '@/lib/mongodb/models/Business'

interface DashboardBusiness {
  name: string
  timezone: string
}

export default async function DashboardPage() {
  const session = await auth()
  await connectDB()
  const business = await Business.findOne({ ownerId: session!.user!.id })
    .select('name timezone')
    .lean<DashboardBusiness>()

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col md:h-dvh">
      <header className="border-b bg-card px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Schedule</h1>
        <p className="text-sm text-body">Who works when. Pick any empty cell to add a shift, or an existing one to change it.</p>
      </header>
      <div className="min-h-0 flex-1 p-3 sm:p-4">
        <ShiftCalendar timeZone={business?.timezone ?? 'Europe/Madrid'} />
      </div>
    </div>
  )
}
