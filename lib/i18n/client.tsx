'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from './locales'
import { t, type TranslationParams } from './translate'

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
  t: (key: string, params?: TranslationParams) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const router = useRouter()

  async function setLocale(nextLocale: Locale) {
    const response = await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: nextLocale }),
    })
    if (!response.ok) throw new Error('Unable to change locale')
    // The refreshed server prop is the source of truth, keeping html lang and UI aligned.
    router.refresh()
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: (key, params) => t(locale, key, params) }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within LocaleProvider')
  return context
}
