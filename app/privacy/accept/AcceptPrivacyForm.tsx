'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { AuthCard, OAuthButtons } from '@/components/auth/AuthCard'
import { PrivacyConsent } from '@/components/auth/PrivacyConsent'

export function AcceptPrivacyForm() {
  const [consent, setConsent] = useState(false)

  async function ensureConsentCookie() {
    try {
      const response = await fetch('/api/privacy-consent', { method: 'POST' })
      if (!response.ok) throw new Error('Consent not saved')
      return true
    } catch {
      toast.error('Could not record your consent. Try again.')
      return false
    }
  }

  return (
    <AuthCard
      title="Accept the privacy notice"
      subtitle="Your account has not been created yet. Read the privacy notice, accept it and continue with the same provider you used to sign in."
      footer={<>You can read the full <Link href="/privacy" target="_blank" className="text-link underline-offset-4 can-hover:hover:underline">privacy notice</Link> before accepting.</>}
    >
      <PrivacyConsent checked={consent} onChange={setConsent} />
      <OAuthButtons
        callbackUrl="/home"
        disabled={!consent}
        descriptionId="accept-consent-hint"
        beforeSignIn={ensureConsentCookie}
      />
      <p id="accept-consent-hint" className="text-sm text-body">
        {consent
          ? 'Continue with the provider you used to sign in.'
          : 'Accept the privacy notice to create your account.'}
      </p>
    </AuthCard>
  )
}
