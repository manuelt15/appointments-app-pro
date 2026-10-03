'use client'

import { useSyncExternalStore } from 'react'
import { Toaster } from 'sonner'

export type ThemePreference = 'system' | 'light' | 'dark'

// Runs before paint so the stored (or system) theme is applied without a flash,
// and keeps following the OS while the preference is "system".
const THEME_SCRIPT = `(function(){var d=document.documentElement,m=matchMedia('(prefers-color-scheme: dark)');function a(){var t;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark')t='system';d.dataset.theme=t;d.classList.toggle('dark',t==='dark'||(t==='system'&&m.matches))}a();m.addEventListener('change',a)})()`

// Executable only in the server HTML; on the client React would warn about rendering a <script>.
export function ThemeScript() {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  )
}

const NEXT_PREFERENCE: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
  return () => observer.disconnect()
}

export function useTheme() {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribe,
    () => (document.documentElement.dataset.theme as ThemePreference | undefined) ?? 'system',
    () => 'system'
  )
  const theme = useSyncExternalStore<'light' | 'dark'>(
    subscribe,
    () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
    () => 'light'
  )

  function cyclePreference() {
    const next = NEXT_PREFERENCE[preference]
    try {
      if (next === 'system') localStorage.removeItem('theme')
      else localStorage.setItem('theme', next)
    } catch {}
    const dark = next === 'dark' || (next === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = next
    document.documentElement.classList.toggle('dark', dark)
  }

  return { preference, theme, cyclePreference }
}

export function ThemedToaster() {
  const { theme } = useTheme()
  return <Toaster position="top-right" theme={theme} />
}
