'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { CalendarDays, ChevronRight, History, House, LogOut, Monitor, Moon, Plus, Settings, Sun, Users } from 'lucide-react'
import { type ThemePreference, useTheme } from '@/components/layout/theme'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const NAVIGATION = [
  { href: '/home', label: 'Home', icon: House },
  { href: '/dashboard', label: 'Schedule', icon: CalendarDays },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/history', label: 'History', icon: History },
]

const SETTINGS = { href: '/settings', label: 'Settings', icon: Settings }

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  credentials: 'email',
}

const THEME_OPTIONS: Record<ThemePreference, { label: string; icon: typeof Settings }> = {
  system: { label: 'Theme: System', icon: Monitor },
  light: { label: 'Theme: Light', icon: Sun },
  dark: { label: 'Theme: Dark', icon: Moon },
}

const ITEM_CLASS =
  'flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-sm font-medium whitespace-nowrap text-body outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 sm:min-h-10'

interface Props {
  business: { _id: string; name: string }
  user: { name?: string | null; email?: string | null; image?: string | null; provider?: string }
}

export default function Sidebar({ business, user }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  return (
    <TooltipProvider>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-4 md:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(true)}
          className="flex min-h-11 items-center gap-1 rounded-full pr-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <BusinessAvatar />
          <span className="flex size-6 items-center justify-center rounded-full border bg-card text-body">
            <ChevronRight className="size-3.5" />
          </span>
        </button>
        <span className="truncate text-sm font-semibold">{business.name}</span>
      </header>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          id="mobile-navigation"
          showCloseButton
          className="top-0 left-0 h-dvh max-w-60 translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-l-0 p-0 duration-200 ease-out data-open:zoom-in-100 data-open:slide-in-from-left data-closed:zoom-out-100 data-closed:slide-out-to-left sm:max-w-60 md:hidden"
        >
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <NavigationContent businessName={business.name} pathname={pathname} user={user} expanded inDrawer onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <aside
        className={cn(
          'relative hidden h-full shrink-0 flex-col border-r bg-card transition-[width] duration-200 ease-in-out motion-reduce:transition-none md:flex',
          expanded ? 'w-60' : 'w-16'
        )}
      >
        <NavigationContent businessName={business.name} pathname={pathname} user={user} expanded={expanded} />
        <Hint label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}>
          <button
            type="button"
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="absolute top-6 -right-3 z-10 flex size-6 items-center justify-center rounded-full border bg-card text-body outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 can-hover:hover:text-foreground"
          >
            <ChevronRight
              className={cn('size-3.5 transition-transform duration-200 ease-in-out motion-reduce:transition-none', expanded && 'rotate-180')}
            />
          </button>
        </Hint>
      </aside>
    </TooltipProvider>
  )
}

function NavigationContent({
  businessName,
  pathname,
  user,
  expanded,
  inDrawer = false,
  onNavigate,
}: {
  businessName: string
  pathname: string
  user: Props['user']
  expanded: boolean
  /** The mobile drawer has no room to its right, so menus open upwards there. */
  inDrawer?: boolean
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className={cn('flex h-16 shrink-0 items-center gap-3 px-4', expanded && 'pr-14')}>
        <BusinessAvatar />
        {expanded && (
          <div className="min-w-0">
            <p className="font-mono text-xs font-medium uppercase text-body">Business</p>
            <p className="truncate text-sm font-semibold">{businessName}</p>
          </div>
        )}
      </div>

      <Divider />

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Main navigation">
        <Hint label="New shift" disabled={expanded}>
          <Link
            href="/dashboard?new=shift"
            onClick={onNavigate}
            aria-label={expanded ? undefined : 'New shift'}
            className={cn(ITEM_CLASS, 'mb-3 bg-[#0070f3] text-white shadow-[0_1px_2px_rgb(0_112_243/0.3)] focus-visible:ring-ring/50 can-hover:hover:bg-[#0761d1]')}
          >
            <Plus className="size-4 shrink-0" />
            {expanded && 'New shift'}
          </Link>
        </Hint>
        {NAVIGATION.map((item) => (
          <NavigationLink key={item.href} item={item} pathname={pathname} expanded={expanded} onNavigate={onNavigate} />
        ))}
      </nav>

      <Divider />

      <div className="space-y-1 p-3">
        <ThemeToggle expanded={expanded} />
        <NavigationLink item={SETTINGS} pathname={pathname} expanded={expanded} onNavigate={onNavigate} />
        <UserMenu user={user} expanded={expanded} inDrawer={inDrawer} />
      </div>
    </div>
  )
}

function NavigationLink({
  item: { href, label, icon: Icon },
  pathname,
  expanded,
  onNavigate,
}: {
  item: typeof SETTINGS
  pathname: string
  expanded: boolean
  onNavigate?: () => void
}) {
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  return (
    <Hint label={label} disabled={expanded}>
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={expanded ? undefined : label}
        className={cn(
          ITEM_CLASS,
          active
            ? 'bg-muted text-foreground'
            : 'can-hover:hover:bg-muted can-hover:hover:text-foreground'
        )}
      >
        <Icon className="size-4 shrink-0" />
        {expanded && label}
      </Link>
    </Hint>
  )
}

function ThemeToggle({ expanded }: { expanded: boolean }) {
  const { preference, cyclePreference } = useTheme()
  const { label, icon: Icon } = THEME_OPTIONS[preference]
  return (
    <Hint label={label} disabled={expanded}>
      <button
        type="button"
        onClick={cyclePreference}
        aria-label={expanded ? undefined : label}
        className={cn(ITEM_CLASS, 'can-hover:hover:bg-muted can-hover:hover:text-foreground')}
      >
        <Icon className="size-4 shrink-0" />
        {expanded && label}
      </button>
    </Hint>
  )
}

function Hint({ label, disabled, children }: { label: string; disabled?: boolean; children: React.ReactElement }) {
  if (disabled) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function BusinessAvatar() {
  return (
    <Image
      src="/business-default.svg"
      alt=""
      width={32}
      height={32}
      unoptimized
      className="shrink-0 rounded-full"
    />
  )
}

function Divider() {
  return <div aria-hidden="true" className="mx-3 h-px shrink-0 rounded-full bg-foreground/15" />
}

function UserAvatar({ user }: { user: Props['user'] }) {
  if (user.image) {
    return (
      <span
        className="size-9 shrink-0 rounded-md bg-muted bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(user.image).slice(1, -1)})` }}
        aria-hidden="true"
      />
    )
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium text-body" aria-hidden="true">
      {user.name?.[0]?.toUpperCase() ?? '?'}
    </span>
  )
}

function UserMenu({ user, expanded, inDrawer }: { user: Props['user']; expanded: boolean; inDrawer: boolean }) {
  const trigger = expanded ? (
    <button
      type="button"
      className="flex w-full items-center gap-2.5 rounded-md border bg-muted/40 p-2 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 can-hover:hover:bg-muted"
    >
      <UserAvatar user={user} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-tight font-medium break-words">{user.name}</span>
        {user.email && <span className="block truncate text-xs text-body">{user.email}</span>}
      </span>
      <ChevronRight className="size-4 shrink-0 text-faint" aria-hidden="true" />
    </button>
  ) : (
    <button
      type="button"
      aria-label={`Account: ${user.name ?? 'you'}`}
      className="flex w-full justify-center rounded-md py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <UserAvatar user={user} />
    </button>
  )

  return (
    <Popover>
      <Hint label={user.name ?? 'Account'} disabled={expanded}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      </Hint>
      <PopoverContent
        side={inDrawer ? 'top' : 'right'}
        align={inDrawer ? 'start' : 'end'}
        sideOffset={inDrawer ? 6 : 12}
        collisionPadding={8}
        className={cn('p-1', inDrawer ? 'w-(--radix-popover-trigger-width)' : 'w-60')}
      >
        <div className="px-2.5 py-2">
          <p className="text-sm leading-tight font-medium break-words">{user.name}</p>
          {user.email && <p className="truncate text-xs text-body">{user.email}</p>}
          {user.provider && (
            <p className="mt-1 text-xs text-faint">Signed in with {PROVIDER_LABELS[user.provider] ?? user.provider}</p>
          )}
        </div>
        <div className="my-1 h-px bg-border" aria-hidden="true" />
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-sm text-foreground outline-none transition-colors focus-visible:bg-muted can-hover:hover:bg-muted"
        >
          <LogOut className="size-4 text-body" />
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  )
}
