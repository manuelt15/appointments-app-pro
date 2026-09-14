'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const COLORS = ['#10b981', '#0070f3', '#6366f1', '#f5a623', '#ee0000', '#7928ca', '#ff0080', '#14b8a6']

export default function NewRoomPage() {
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(1)
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, capacity, color }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Failed to create room')
      }

      toast.success('Room added')
      router.push('/rooms')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-2 border-b bg-card px-4 py-3 sm:px-6">
        <Button asChild variant="ghost" size="icon" aria-label="Back to rooms">
          <Link href="/rooms"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Add room</h1>
      </header>
      <div className="w-full max-w-lg p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-card p-5 sm:p-6" aria-busy={loading}>
          <div className="space-y-2">
            <Label htmlFor="room-name">Room name</Label>
            <Input id="room-name" value={name} onChange={(event) => setName(event.target.value)} required placeholder="Consultation Room A" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input id="capacity" type="number" value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} min={1} required />
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Calendar color</legend>
            <ColorPicker colors={COLORS} value={color} onChange={setColor} label="Room color" />
          </fieldset>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Adding…' : 'Add room'}
          </Button>
        </form>
      </div>
    </div>
  )
}
