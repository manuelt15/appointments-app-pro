import Link from 'next/link'
import { Plus } from 'lucide-react'
import RoomList from '@/components/rooms/RoomList'
import { Button } from '@/components/ui/button'

export default function RoomsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-col gap-4 border-b bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Rooms</h1>
          <p className="text-sm text-body">Manage your spaces</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/rooms/new"><Plus />Add room</Link>
        </Button>
      </header>
      <div className="flex-1 p-4 sm:p-6">
        <RoomList />
      </div>
    </div>
  )
}
