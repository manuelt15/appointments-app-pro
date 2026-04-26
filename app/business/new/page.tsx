'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const TIMEZONES = [
  'Europe/Madrid', 'Europe/London', 'Europe/Paris', 'America/New_York',
  'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Mexico_City',
]

export default function NewBusinessPage() {
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('Europe/Madrid')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, timezone }),
    })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to create business')
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
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Set up your business</h1>
          <p className="mt-1 text-sm text-[#6e6e73]">You're almost there. Just a few details.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Business name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-[#86868b] px-3 py-2.5 text-sm text-[#1d1d1f] placeholder-[#6e6e73] focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
              placeholder="Acme Clinic"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-[#86868b] px-3 py-2.5 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3] bg-white"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0066cc] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
