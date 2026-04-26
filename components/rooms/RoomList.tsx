'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Trash2, DoorOpen } from 'lucide-react'
import type { Room } from '@/types'

export default function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rooms')
      .then((r) => r.json())
      .then((d) => setRooms(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name}?`)) return
    const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setRooms((prev) => prev.filter((r) => r._id !== id))
      toast.success('Room removed')
    } else {
      toast.error('Failed to remove room')
    }
  }

  if (loading) return <div className="text-sm text-[#6e6e73]">Loading…</div>

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <DoorOpen className="w-8 h-8 text-[#d2d2d7] mx-auto mb-3" />
        <p className="text-sm text-[#6e6e73]">No rooms yet. Add your first space.</p>
      </div>
    )
  }

  return (
    <ul className="bg-white rounded-2xl border border-[#d2d2d7] divide-y divide-[#d2d2d7]">
      {rooms.map((room) => (
        <li key={room._id} className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: room.color }} />
            <div>
              <p className="text-sm font-medium text-[#1d1d1f]">{room.name}</p>
              <p className="text-xs text-[#6e6e73]">Capacity: {room.capacity}</p>
            </div>
          </div>
          <button
            onClick={() => handleDelete(room._id, room.name)}
            className="p-2 text-[#6e6e73] hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  )
}
