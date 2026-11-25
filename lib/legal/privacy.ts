/**
 * Version of the privacy notice a user accepts when creating an account.
 * Bump it when the notice changes so the accepted version stays on record.
 * The public notice (app/privacy/page.tsx) shows the matching "last updated" date.
 */
export const PRIVACY_NOTICE_VERSION = '2026-11-25'

/**
 * Short-lived, HttpOnly cookie that carries the consent from the register or login
 * page to the OAuth callback. The callback runs as its own server request and
 * cannot see the checkbox, so the acceptance travels in this cookie.
 */
export const PRIVACY_CONSENT_COOKIE = 'privacy_consent'

export const PRIVACY_CONSENT_MAX_AGE = 600

export function privacyConsentFields(now: Date = new Date()) {
  return {
    privacyAcceptedAt: now,
    privacyVersion: PRIVACY_NOTICE_VERSION,
  }
}
