'use client'

import { useEffect, useState } from 'react'
import { DoorOpen, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { Room } from '@/types'

export default function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadRooms() {
      try {
        const response = await fetch('/api/rooms', { signal: controller.signal })
        if (!response.ok) throw new Error('Rooms could not be loaded.')
        const data = await response.json()
        setRooms(data.data ?? [])
        setError('')
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : 'Rooms could not be loaded.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadRooms()
    return () => controller.abort()
  }, [refreshKey])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      const response = await fetch(`/api/rooms/${deleteTarget._id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to remove room')
      setRooms((current) => current.filter((room) => room._id !== deleteTarget._id))
      setDeleteTarget(null)
      toast.success('Room removed')
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Failed to remove room')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className="text-sm text-body" role="status">Loading rooms…</p>

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center" role="alert">
        <p className="text-sm text-body">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => { setLoading(true); setRefreshKey((key) => key + 1) }}>Try again</Button>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="rounded-lg border bg-card py-12 text-center">
        <DoorOpen className="mx-auto mb-3 size-8 text-body" aria-hidden="true" />
        <p className="text-sm text-body">No rooms yet. Add your first space.</p>
      </div>
    )
  }

  return (
    <>
      <ul className="divide-y overflow-hidden rounded-lg border bg-card">
        {rooms.map((room) => (
          <li key={room._id} className="flex min-w-0 items-center justify-between gap-4 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="size-8 shrink-0 rounded-full" style={{ backgroundColor: room.color }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{room.name}</p>
                <p className="text-xs text-body">Capacity: {room.capacity}</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${room.name}`} onClick={() => setDeleteTarget(room)}>
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove room?"
        description={`${deleteTarget?.name ?? 'This room'} will be deactivated and its future appointments will be cancelled.`}
        confirmLabel="Remove room"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
