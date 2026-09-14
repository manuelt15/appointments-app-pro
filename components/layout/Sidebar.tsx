'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { CalendarDays, DoorOpen, LogOut, Menu, Settings, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const NAVIGATION = [
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
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <span className="truncate text-sm font-semibold">{business.name}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(true)}
        >
          <Menu />
        </Button>
      </header>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          id="mobile-navigation"
          showCloseButton
          className="top-0 left-0 h-dvh max-w-60 translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-l-0 p-0 sm:max-w-60 md:hidden"
        >
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <NavigationContent businessName={business.name} pathname={pathname} user={user} onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <aside className="hidden h-dvh w-60 shrink-0 flex-col border-r bg-card md:flex">
        <NavigationContent businessName={business.name} pathname={pathname} user={user} />
      </aside>
    </>
  )
}

function NavigationContent({
  businessName,
  pathname,
  user,
  onNavigate,
}: {
  businessName: string
  pathname: string
  user: Props['user']
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-5 py-5 pr-14">
        <p className="font-mono text-xs font-medium uppercase text-body">Business</p>
        <p className="mt-1 truncate text-sm font-semibold">{businessName}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
        {NAVIGATION.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm font-medium text-body outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 sm:min-h-10',
                active
                  ? 'bg-muted text-foreground'
                  : 'can-hover:hover:bg-muted can-hover:hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-1 border-t p-3">
        <div className="flex min-w-0 items-center gap-3 px-3 py-2">
          {user.image ? (
            <span
              className="size-8 shrink-0 rounded-full bg-muted bg-cover bg-center"
              style={{ backgroundImage: `url(${JSON.stringify(user.image).slice(1, -1)})` }}
              aria-hidden="true"
            />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-body" aria-hidden="true">
              {user.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
          <span className="truncate text-sm">{user.name}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut />
          Sign out
        </Button>
      </div>
    </div>
  )
}
