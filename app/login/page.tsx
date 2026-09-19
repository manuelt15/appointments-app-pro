'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { AuthCard, AuthSeparator, OAuthButtons } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCredentials(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        toast.error('Invalid email or password')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Sign in failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Plan who works and when, and keep your team's schedule in one place."
      footer={<>Don&apos;t have an account? <Link href="/register" className="text-link underline-offset-4 can-hover:hover:underline">Create one</Link></>}
    >
      <OAuthButtons callbackUrl="/dashboard" />
      <AuthSeparator />
      <form onSubmit={handleCredentials} className="space-y-4" aria-busy={loading}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder="••••••••" />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  )
}
