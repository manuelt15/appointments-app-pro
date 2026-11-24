import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AcceptPrivacyForm } from './AcceptPrivacyForm'

export const metadata: Metadata = { title: 'Accept the privacy notice' }

/**
 * Landing page for a new OAuth account that arrived without a recorded
 * acceptance. The signIn guard sends it here before the adapter creates the
 * user, so there is no session yet: accepting sets the short-lived consent
 * cookie and the user signs in again to finish creating the account.
 */
export default async function AcceptPrivacyPage() {
  const session = await auth()
  if (session?.user?.id) redirect('/home')

  return <AcceptPrivacyForm />
}
