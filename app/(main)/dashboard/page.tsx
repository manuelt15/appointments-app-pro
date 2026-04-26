import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb/client'
import { Business } from '@/lib/mongodb/models/Business'
import GlobalCalendar from '@/components/calendar/GlobalCalendar'

export default async function DashboardPage() {
  const session = await auth()
  await connectDB()
  const business = await Business.findOne({ ownerId: session!.user!.id }).lean()

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#d2d2d7] bg-white">
        <h1 className="text-xl font-semibold text-[#1d1d1f]">Calendar</h1>
        <p className="text-sm text-[#6e6e73]">{(business as any)?.name}</p>
      </div>
      <div className="flex-1 p-4">
        <GlobalCalendar />
      </div>
    </div>
  )
}
