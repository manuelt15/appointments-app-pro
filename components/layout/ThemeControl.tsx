'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { SegmentedControl, type SegmentedOption } from '@/components/layout/SegmentedControl'
import { type ThemePreference, useTheme } from '@/components/layout/theme'
import { useLocale } from '@/lib/i18n/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const THEME_OPTIONS = [
  { value: 'system', icon: Monitor, labelKey: 'nav.themeSystem' },
  { value: 'light', icon: Sun, labelKey: 'nav.themeLight' },
  { value: 'dark', icon: Moon, labelKey: 'nav.themeDark' },
] as const

/**
 * Theme: three icons in one box, the active one in a pill. When the sidebar is
 * collapsed (64px) the box does not fit, so a single trigger shows the active
 * icon and opens the very same control in a popover.
 */
export function ThemeControl({ expanded }: { expanded: boolean }) {
  const { preference, setPreference } = useTheme()
  const { t } = useLocale()
  const current = THEME_OPTIONS.find((option) => option.value === preference) ?? THEME_OPTIONS[0]
  const options: SegmentedOption<ThemePreference>[] = THEME_OPTIONS.map((option) => ({
    value: option.value,
    icon: option.icon,
    ariaLabel: t(option.labelKey),
  }))
  const currentLabel = t(current.labelKey)

  if (!expanded) {
    const ActiveIcon = current.icon
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={currentLabel}
            title={currentLabel}
            className="mx-auto flex size-10 items-center justify-center rounded-xl border bg-card text-body outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 can-hover:hover:text-foreground"
          >
            <ActiveIcon className="size-4 shrink-0" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="end" sideOffset={12} collisionPadding={8} className="w-44 p-0">
          <SegmentedControl
            options={options}
            value={preference}
            onChange={setPreference}
            ariaLabel={currentLabel}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <SegmentedControl
      options={options}
      value={preference}
      onChange={setPreference}
      ariaLabel={currentLabel}
    />
  )
}
