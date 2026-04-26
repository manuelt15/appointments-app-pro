'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      toast.error('Invalid email or password')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-[#6e6e73]">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#0071e3] hover:underline">Create one</Link>
          </p>
        </div>

        {/* OAuth providers */}
        <div className="space-y-3">
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-[#d2d2d7] text-sm font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <button
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-[#d2d2d7] text-sm font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#d2d2d7]" />
          </div>
          <div className="relative flex justify-center text-xs text-[#6e6e73] bg-white px-2">or</div>
        </div>

        <form onSubmit={handleCredentials} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-[#86868b] px-3 py-2.5 text-sm text-[#1d1d1f] placeholder-[#6e6e73] focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[#86868b] px-3 py-2.5 text-sm text-[#1d1d1f] placeholder-[#6e6e73] focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0066cc] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
