'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { AuthCard, OAuthButtons } from '@/components/auth/AuthCard'
import { PrivacyConsent } from '@/components/auth/PrivacyConsent'
import { useLocale } from '@/lib/i18n/client'

export function AcceptPrivacyForm() {
  const { t } = useLocale()
  const [consent, setConsent] = useState(false)

  async function ensureConsentCookie() {
    try {
      const response = await fetch('/api/privacy-consent', { method: 'POST' })
      if (!response.ok) throw new Error('Consent not saved')
      return true
    } catch {
      toast.error(t('auth.consentError'))
      return false
    }
  }

  return (
    <AuthCard
      title={t('auth.acceptPrivacy.title')}
      subtitle={t('auth.acceptPrivacy.subtitle')}
      footer={<>{t('auth.acceptPrivacy.footerPrefix')}<Link href="/privacy" target="_blank" className="text-link underline-offset-4 can-hover:hover:underline">{t('auth.acceptPrivacy.footerLink')}</Link>{t('auth.acceptPrivacy.footerSuffix')}</>}
    >
      <PrivacyConsent checked={consent} onChange={setConsent} />
      <OAuthButtons
        callbackUrl="/home"
        disabled={!consent}
        descriptionId="accept-consent-hint"
        beforeSignIn={ensureConsentCookie}
      />
      <p id="accept-consent-hint" className="text-sm text-body">
        {consent ? t('auth.acceptPrivacy.oauthReady') : t('auth.acceptPrivacy.oauthNeedsConsent')}
      </p>
    </AuthCard>
  )
}
