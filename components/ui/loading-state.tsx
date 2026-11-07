'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/*
 * Pixel-grid loader with a shimmering label and a live elapsed timer.
 *
 * Variants:
 *   drive: square cells, a chevron wavefront driving right; the 650ms cycle is shorter
 *          than the sweep, so two fronts are always in flight
 *   dots:  the same wavefront with round cells
 *   orbit: a comet lapping the grid perimeter
 *
 * Reduced motion freezes the grid in its dim state and stops the shimmer; the timer
 * still ticks. Keyframes `pixel-on` and `shimmer-text` live in app/globals.css.
 */

const chevron = Array.from({ length: 9 }, (_, i) => {
  const row = Math.floor(i / 3)
  const col = i % 3
  return (col + Math.abs(row - 1)) * 90
})

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3]
const orbit = Array.from({ length: 9 }, (_, i) => {
  const step = ORBIT_ORDER.indexOf(i)
  return step === -1 ? null : step * 110
})

const PATTERNS = {
  drive: { delays: chevron, duration: 650, round: false },
  dots: { delays: chevron, duration: 650, round: true },
  orbit: { delays: orbit, duration: 950, round: false },
} satisfies Record<string, { delays: (number | null)[]; duration: number; round: boolean }>

type Variant = keyof typeof PATTERNS

function LoaderGrid({ variant }: { variant: Variant }) {
  const { delays, duration, round } = PATTERNS[variant]
  return (
    <span aria-hidden className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]">
      {delays.map((delay, index) => (
        <span
          key={index}
          className={cn('loader-pixel size-1 bg-foreground', round ? 'rounded-full' : 'rounded-[1px]')}
          style={{
            opacity: delay === null ? 0.07 : 0.15,
            animation: delay === null ? 'none' : `pixel-on ${duration}ms ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </span>
  )
}

function useElapsed() {
  const [tenths, setTenths] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTenths((current) => current + 1), 100)
    return () => clearInterval(timer)
  }, [])
  const seconds = tenths / 10
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(1)}s`
}

export function LoadingState({
  label,
  variant = 'drive',
  className,
}: {
  label: string
  variant?: Variant
  className?: string
}) {
  const elapsed = useElapsed()

  return (
    <div role="status" className={cn('flex w-fit items-center gap-2.5', className)}>
      <LoaderGrid variant={variant} />
      <span
        className="loader-shimmer bg-clip-text text-[13px] font-medium text-transparent"
        style={{
          backgroundImage: 'linear-gradient(90deg, var(--body) 35%, var(--foreground) 50%, var(--body) 65%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-text 1.4s linear infinite',
        }}
      >
        {label}
      </span>
      <span className="font-mono text-xs text-body tabular-nums">{elapsed}</span>
    </div>
  )
}
