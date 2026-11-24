'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { AuthCard, AuthSeparator, OAuthButtons } from '@/components/auth/AuthCard'
import { PrivacyConsent } from '@/components/auth/PrivacyConsent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLocale } from '@/lib/i18n/client'

export default function LoginPage() {
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleConsentChange(checked: boolean) {
    setConsent(checked)
    // Signing in with OAuth starts on this page but the account is resolved in
    // the callback, so the acceptance has to travel in the short-lived cookie.
    void fetch('/api/privacy-consent', { method: checked ? 'POST' : 'DELETE' }).catch(() => {})
  }

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

  async function handleCredentials(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        toast.error(t('auth.invalidCredentials'))
        return
      }
      router.push('/home')
      router.refresh()
    } catch {
      toast.error(t('auth.signInFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={<>{t('auth.login.footerQuestion')}<Link href="/register" className="text-link underline-offset-4 can-hover:hover:underline">{t('auth.login.footerLink')}</Link></>}
    >
      <PrivacyConsent checked={consent} onChange={handleConsentChange} />
      <OAuthButtons
        callbackUrl="/home"
        disabled={!consent}
        descriptionId="oauth-consent-hint"
        beforeSignIn={ensureConsentCookie}
      />
      <p id="oauth-consent-hint" className="text-sm text-body">
        {consent ? t('auth.login.oauthReady') : t('auth.login.oauthNeedsConsent')}
      </p>
      <AuthSeparator />
      <form onSubmit={handleCredentials} className="space-y-4" aria-busy={loading}>
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder="••••••••" />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>
    </AuthCard>
  )
}
