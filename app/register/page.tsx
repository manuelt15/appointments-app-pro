'use client'

import { useRef, useState } from 'react'
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

export default function RegisterPage() {
  const { t } = useLocale()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const consentRef = useRef<HTMLInputElement>(null)

  function handleConsentChange(checked: boolean) {
    setConsent(checked)
    setConsentError(false)
    // The OAuth callback runs as its own server request and cannot see this
    // checkbox, so the acceptance travels in a short-lived cookie.
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

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault()

    // The privacy notice must be accepted before the account is created.
    if (!consent) {
      setConsentError(true)
      consentRef.current?.focus()
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, privacyAccepted: consent }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? t('auth.registrationFailed'))
      }

      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) throw new Error(t('auth.signInAfterRegistrationFailed'))

      router.push('/business/new')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={<>{t('auth.register.footerQuestion')}<Link href="/login" className="text-link underline-offset-4 can-hover:hover:underline">{t('auth.register.footerLink')}</Link></>}
    >
      <OAuthButtons
        callbackUrl="/business/new"
        disabled={!consent}
        descriptionId="oauth-consent-hint"
        beforeSignIn={ensureConsentCookie}
      />
      <p id="oauth-consent-hint" className="text-sm text-body">
        {consent ? t('auth.register.oauthReady') : t('auth.register.oauthNeedsConsent')}
      </p>
      <AuthSeparator />
      <form onSubmit={handleRegister} className="space-y-4" aria-busy={loading}>
        <div className="space-y-2">
          <Label htmlFor="name">{t('auth.name')}</Label>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" placeholder={t('auth.namePlaceholder')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" placeholder={t('auth.passwordPlaceholder')} />
        </div>
        <PrivacyConsent checked={consent} error={consentError} onChange={handleConsentChange} inputRef={consentRef} />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('auth.register.creating') : t('auth.register.submit')}
        </Button>
      </form>
    </AuthCard>
  )
}
