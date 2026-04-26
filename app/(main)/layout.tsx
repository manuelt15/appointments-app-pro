import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb/client'
import { Business } from '@/lib/mongodb/models/Business'
import Sidebar from '@/components/layout/Sidebar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  await connectDB()
  const business = await Business.findOne({ ownerId: session.user.id }).lean()
  if (!business) redirect('/business/new')

  const businessData = { _id: (business as any)._id.toString(), name: (business as any).name }

  return (
    <div className="flex h-screen bg-[#f5f5f7]">
      <Sidebar business={businessData} user={{ name: session.user.name, image: session.user.image }} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
