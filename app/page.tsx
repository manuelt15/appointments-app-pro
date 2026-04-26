import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb/client'
import { Business } from '@/lib/mongodb/models/Business'

export default async function RootPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  await connectDB()
  const business = await Business.findOne({ ownerId: session.user.id })
  if (!business) redirect('/business/new')

  redirect('/dashboard')
}
