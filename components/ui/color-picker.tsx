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
      {colors.map((color, index) => {
        const selected = value === color
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (!colors.includes(value) && index === 0) ? 0 : -1}
            aria-label={`${label}: ${COLOR_NAMES[color.toLowerCase()] ?? 'Custom color'}`}
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
