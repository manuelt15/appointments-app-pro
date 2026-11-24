import { ObjectId } from 'mongodb'
import { clientPromise } from '@/lib/mongodb/client'
import { privacyConsentFields } from './privacy'
import { clearPrivacyConsentCookie, readPrivacyConsentCookie } from './privacy-consent'

type OAuthUser = {
  id?: string
  email?: string | null
}

/**
 * NextAuth `events.createUser`. The OAuth callback creates the user through the
 * adapter, outside the register form, so the acceptance arrives in the
 * short-lived privacy consent cookie. If the cookie is missing or expired the
 * account is still created, as before, but without the consent fields and the
 * omission is logged instead of hidden.
 */
export async function createUserEvent({ user }: { user: OAuthUser }): Promise<void> {
  const accepted = await readPrivacyConsentCookie()
  await clearPrivacyConsentCookie()

  if (!user.id) {
    console.warn('[privacy] OAuth sign-up arrived without a user id: consent was not recorded.')
    return
  }

  if (!accepted) {
    console.warn(
      `[privacy] OAuth sign-up ${user.email ?? user.id} was created without privacy consent: ` +
        'the privacy_consent cookie was missing or had expired, so the account has no privacyAcceptedAt.',
    )
    return
  }

  const client = await clientPromise
  const result = await client
    .db()
    .collection('users')
    .updateOne({ _id: new ObjectId(user.id) }, { $set: privacyConsentFields() })

  if (result.matchedCount === 0) {
    console.warn(`[privacy] Consent for ${user.email ?? user.id} could not be recorded: user document not found.`)
  }
}
