'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SegmentedOption<T extends string> = {
  value: T
  text?: string
  icon?: LucideIcon
  /** Full accessible name, e.g. "Tema claro". */
  ariaLabel: string
}

/**
 * One bordered box holding mutually exclusive options, as in the reference:
 * a card background, a hairline border and rounded corners, with the active
 * option marked by a soft pill. Icons or short text, never both in one box.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('flex w-full items-center gap-1 rounded-md border bg-card p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-8 flex-1 items-center justify-center rounded-sm px-2 outline-none transition-colors',
              'focus-visible:ring-3 focus-visible:ring-ring/30',
              active ? 'bg-muted text-foreground' : 'text-body can-hover:hover:text-foreground'
            )}
          >
            {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : (
              <span aria-hidden="true" className="text-xs font-semibold uppercase">{option.text}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
