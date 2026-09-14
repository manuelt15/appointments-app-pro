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

const COLORS = ['#6366f1', '#0070f3', '#10b981', '#f5a623', '#ee0000', '#7928ca', '#ff0080', '#14b8a6']

export default function NewEmployeePage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email: email || null, color }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? 'Failed to create employee')
      }

      toast.success('Employee added')
      router.push('/employees')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-2 border-b bg-card px-4 py-3 sm:px-6">
        <Button asChild variant="ghost" size="icon" aria-label="Back to employees">
          <Link href="/employees"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Add employee</h1>
      </header>
      <div className="w-full max-w-lg p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-card p-5 sm:p-6" aria-busy={loading}>
          <div className="space-y-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="name" placeholder="Jane Smith" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="font-normal text-body">(optional)</span></Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="jane@example.com" />
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Calendar color</legend>
            <ColorPicker colors={COLORS} value={color} onChange={setColor} label="Employee color" />
          </fieldset>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Adding…' : 'Add employee'}
          </Button>
        </form>
      </div>
    </div>
  )
}
