import { auth } from '@/auth'
import ShiftCalendar from '@/components/calendar/ShiftCalendar'
import { getLocale, t } from '@/lib/i18n'
import { connectDB } from '@/lib/mongodb/client'
import { Business } from '@/lib/mongodb/models/Business'

interface DashboardBusiness {
  name: string
  timezone: string
}

export default async function DashboardPage() {
  const locale = await getLocale()
  const session = await auth()
  await connectDB()
  const business = await Business.findOne({ ownerId: session!.user!.id })
    .select('name timezone')
    .lean<DashboardBusiness>()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b bg-card px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{t(locale, 'calendar.title')}</h1>
        <p className="text-sm text-body">{t(locale, 'calendar.subtitle')}</p>
      </header>
      <div className="min-h-0 flex-1 p-3 sm:p-4">
        <ShiftCalendar timeZone={business?.timezone ?? 'Europe/Madrid'} />
      </div>
    </div>
  )
}
