import Link from 'next/link'
import { Plus } from 'lucide-react'
import RoomList from '@/components/rooms/RoomList'

export default function RoomsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#d2d2d7] bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1d1d1f]">Rooms</h1>
          <p className="text-sm text-[#6e6e73]">Manage your spaces</p>
        </div>
        <Link
          href="/rooms/new"
          className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0066cc] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add room
        </Link>
      </div>
      <div className="flex-1 p-6">
        <RoomList />
      </div>
    </div>
  )
}
