import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getLocale, t } from '@/lib/i18n'
import { AcceptPrivacyForm } from './AcceptPrivacyForm'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return { title: t(locale, 'auth.acceptPrivacy.title') }
}

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
