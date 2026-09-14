import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Sidebar from '@/components/layout/Sidebar'
import { connectDB } from '@/lib/mongodb/client'
import { Business } from '@/lib/mongodb/models/Business'

interface MainBusiness {
  _id: { toString(): string }
  name: string
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  await connectDB()
  const business = await Business.findOne({ ownerId: session.user.id })
    .select('_id name')
    .lean<MainBusiness>()
  if (!business) redirect('/business/new')

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar
        business={{ _id: business._id.toString(), name: business.name }}
        user={{ name: session.user.name, image: session.user.image }}
      />
      <main className="min-w-0 flex-1 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
