'use client'

import { Check } from 'lucide-react'

const COLOR_NAMES: Record<string, string> = {
  '#6366f1': 'Indigo',
  '#0070f3': 'Blue',
  '#10b981': 'Emerald',
  '#f5a623': 'Amber',
  '#ee0000': 'Red',
  '#7928ca': 'Purple',
  '#ff0080': 'Pink',
  '#14b8a6': 'Teal',
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
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {colors.map((color) => {
        const selected = value === color
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${label}: ${COLOR_NAMES[color.toLowerCase()] ?? 'Custom color'}`}
            onClick={() => onChange(color)}
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
