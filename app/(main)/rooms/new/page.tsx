'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

const COLORS = ['#10b981', '#0071e3', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export default function NewRoomPage() {
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(1)
  const [color, setColor] = useState('#10b981')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, capacity, color }),
    })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to create room')
    } else {
      toast.success('Room added')
      router.push('/rooms')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#d2d2d7] bg-white flex items-center gap-3">
        <Link href="/rooms" className="text-[#6e6e73] hover:text-[#1d1d1f]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold text-[#1d1d1f]">Add room</h1>
      </div>
      <div className="flex-1 p-6 max-w-md">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#d2d2d7] p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Room name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-[#86868b] px-3 py-2.5 text-sm text-[#1d1d1f] placeholder-[#6e6e73] focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
              placeholder="Consultation Room A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              min={1}
              required
              className="w-full rounded-lg border border-[#86868b] px-3 py-2.5 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c, borderColor: color === c ? c : 'transparent', outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0066cc] transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding…' : 'Add room'}
          </button>
        </form>
      </div>
    </div>
  )
}
