'use client'

import { Check } from 'lucide-react'

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
            aria-label={`${label}: ${color}`}
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
