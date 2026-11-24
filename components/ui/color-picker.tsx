'use client'

import { Check } from 'lucide-react'
import { useLocale } from '@/lib/i18n/client'
import type { TranslationKey } from '@/lib/i18n/translate'

/** Colour names live in the dictionary: they are read out by screen readers. */
const COLOR_KEYS: Record<string, TranslationKey> = {
  '#6366f1': 'common.color.indigo',
  '#0070f3': 'common.color.blue',
  '#10b981': 'common.color.emerald',
  '#f5a623': 'common.color.amber',
  '#ee0000': 'common.color.red',
  '#7928ca': 'common.color.purple',
  '#ff0080': 'common.color.pink',
  '#14b8a6': 'common.color.teal',
}

export function ColorPicker({
  colors,
  value,
  onChange,
  label,
}: {
  colors: string[]
  value: string
  onChange: (color: string) => void
  label: string
}) {
  const { t } = useLocale()
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {colors.map((color, index) => {
        const selected = value === color
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (!colors.includes(value) && index === 0) ? 0 : -1}
            aria-label={`${label}: ${t(COLOR_KEYS[color.toLowerCase()] ?? 'common.color.custom')}`}
            onClick={() => onChange(color)}
            onKeyDown={(event) => {
              let nextIndex: number
              switch (event.key) {
                case 'ArrowRight':
                case 'ArrowDown': nextIndex = (index + 1) % colors.length; break
                case 'ArrowLeft':
                case 'ArrowUp': nextIndex = (index - 1 + colors.length) % colors.length; break
                case 'Home': nextIndex = 0; break
                case 'End': nextIndex = colors.length - 1; break
                default: return
              }
              event.preventDefault()
              onChange(colors[nextIndex])
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex]?.focus()
            }}
            className="flex size-11 items-center justify-center rounded-full border-2 border-card outline-offset-2 transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.97] can-hover:hover:scale-105"
            style={{ backgroundColor: color, boxShadow: selected ? `0 0 0 2px ${color}` : undefined }}
          >
            {selected && <Check className="size-4 text-white drop-shadow-sm" aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  )
}
