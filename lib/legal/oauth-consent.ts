import { ObjectId } from 'mongodb'
import type { NextAuthConfig } from 'next-auth'
import { clientPromise } from '@/lib/mongodb/client'
import { privacyConsentFields } from './privacy'
import { clearPrivacyConsentCookie, readPrivacyConsentCookie } from './privacy-consent'

type OAuthUser = {
  id?: string
  email?: string | null
}

export type SignInParams = Parameters<NonNullable<NonNullable<NextAuthConfig['callbacks']>['signIn']>>[0]

/**
 * Where a new OAuth account goes when it has no recorded acceptance. It is a
 * public page: the account is not created and no session is issued until the
 * notice is accepted, so the new user cannot reach the private area nor the
 * business endpoint in the meantime.
 */
export const PRIVACY_ACCEPT_PATH = '/privacy/accept'

/**
 * NextAuth `callbacks.signIn`. It runs before the adapter creates an OAuth
 * user, which is the only moment where "new account" is known for sure.
 *
 * - An existing account signs in normally, always: accounts created before the
 *   notice was enforced have no privacyAcceptedAt and must keep entering. The
 *   legal basis for the account itself is the contract (art. 6.1.b), so a
 *   missing acceptance is never a reason to block access.
 * - Credentials sign-in is untouched; /api/register already requires the
 *   acceptance when the account is created.
 * - A new OAuth account whose browser did not carry the consent cookie is sent
 *   to PRIVACY_ACCEPT_PATH. Accepting there sets the cookie and the user signs
 *   in again, so the createUser event records privacyAcceptedAt and
 *   privacyVersion with the account.
 */
export async function enforcePrivacyAtSignUp({ user, account }: SignInParams): Promise<boolean | string> {
  if (!account || account.provider === 'credentials') return true

  if (await readPrivacyConsentCookie()) return true

  if (await oauthAccountExists(account.provider, account.providerAccountId)) return true
  if (user.email && (await userExistsByEmail(user.email))) return true

  return PRIVACY_ACCEPT_PATH
}

/** True when this provider account is already linked to a user (an existing account). */
async function oauthAccountExists(provider: string, providerAccountId: string): Promise<boolean> {
  const client = await clientPromise
  const account = await client
    .db()
    .collection('accounts')
    .findOne({ provider, providerAccountId }, { projection: { _id: 1 } })
  return account !== null
}

/** True when the email already belongs to an account created through /api/register. */
async function userExistsByEmail(email: string): Promise<boolean> {
  const client = await clientPromise
  const user = await client.db().collection('users').findOne({ email }, { projection: { _id: 1 } })
  return user !== null
}

/**
 * NextAuth `events.createUser`. The OAuth callback creates the user through the
 * adapter, outside the register form, so the acceptance arrives in the
 * short-lived privacy consent cookie. The signIn guard above redirects to the
 * accept page when that cookie is missing, so reaching this event without it
 * means the account was created through another path: no consent is invented,
 * the omission is logged instead of hidden.
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
