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

export default function RegisterPage() {
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
      toast.error('Could not record your consent. Try again.')
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
        throw new Error(data?.error ?? 'Registration failed')
      }

      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) throw new Error('Sign in failed after registration')

      router.push('/business/new')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Create account"
      subtitle="Set up your team's shift schedule: add employees, plan their hours and track time off."
      footer={<>Already have an account? <Link href="/login" className="text-link underline-offset-4 can-hover:hover:underline">Sign in</Link></>}
    >
      <OAuthButtons
        callbackUrl="/business/new"
        disabled={!consent}
        descriptionId="oauth-consent-hint"
        beforeSignIn={ensureConsentCookie}
      />
      <p id="oauth-consent-hint" className="text-sm text-body">
        {consent
          ? 'Google and GitHub will create your account with the privacy notice accepted.'
          : 'Accept the privacy notice below to continue with Google or GitHub.'}
      </p>
      <AuthSeparator />
      <form onSubmit={handleRegister} className="space-y-4" aria-busy={loading}>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" placeholder="Minimum 8 characters" />
        </div>
        <PrivacyConsent checked={consent} error={consentError} onChange={handleConsentChange} inputRef={consentRef} />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  )
}
