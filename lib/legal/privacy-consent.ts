import { cookies } from 'next/headers'
import { PRIVACY_CONSENT_COOKIE } from './privacy'

export async function readPrivacyConsentCookie(): Promise<boolean> {
  const store = await cookies()
  return store.get(PRIVACY_CONSENT_COOKIE)?.value === '1'
}

export async function clearPrivacyConsentCookie(): Promise<void> {
  const store = await cookies()
  store.delete(PRIVACY_CONSENT_COOKIE)
}
