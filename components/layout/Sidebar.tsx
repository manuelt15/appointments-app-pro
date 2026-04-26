'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { CalendarDays, Users, DoorOpen, Settings, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Calendar', icon: CalendarDays },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/rooms', label: 'Rooms', icon: DoorOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface Props {
  business: { _id: string; name: string }
  user: { name?: string | null; image?: string | null }
}

export default function Sidebar({ business, user }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 bg-white border-b border-[#d2d2d7]">
        <span className="text-sm font-semibold text-[#1d1d1f]">{business.name}</span>
        <button onClick={() => setOpen(!open)} className="text-[#6e6e73]">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/20" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed md:relative z-20 flex flex-col w-60 h-full bg-white border-r border-[#d2d2d7] transition-transform',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Business name */}
        <div className="px-5 py-5 border-b border-[#d2d2d7]">
          <p className="text-xs text-[#6e6e73] font-medium uppercase tracking-wide">Business</p>
          <p className="mt-0.5 text-sm font-semibold text-[#1d1d1f] truncate">{business.name}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#f5f5f7] text-[#1d1d1f]'
                    : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-[#d2d2d7] space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            {user.image ? (
              <img src={user.image} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#f5f5f7] flex items-center justify-center text-xs font-medium text-[#6e6e73]">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm text-[#1d1d1f] truncate">{user.name}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
