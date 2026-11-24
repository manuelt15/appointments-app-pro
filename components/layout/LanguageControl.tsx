'use client'

import { SegmentedControl, type SegmentedOption } from '@/components/layout/SegmentedControl'
import { useLocale } from '@/lib/i18n/client'
import type { Locale } from '@/lib/i18n/locales'

const OPTIONS: { value: Locale; labelKey: string }[] = [
  { value: 'es', labelKey: 'nav.languageSpanish' },
  { value: 'en', labelKey: 'nav.languageEnglish' },
]

/**
 * Language: "ES" and "EN" in the same box as the theme control, with no label
 * next to it. Collapsed (64px) there is no room for both, so a single button
 * shows the active code and switches to the other one.
 */
export function LanguageControl({ expanded }: { expanded: boolean }) {
  const { locale, setLocale, t } = useLocale()
  const options: SegmentedOption<Locale>[] = OPTIONS.map((option) => ({
    value: option.value,
    text: option.value,
    ariaLabel: t(option.labelKey),
  }))
  const activeName = t(locale === 'es' ? 'nav.languageSpanish' : 'nav.languageEnglish')

  if (!expanded) {
    const next: Locale = locale === 'es' ? 'en' : 'es'
    return (
      <button
        type="button"
        onClick={() => void setLocale(next)}
        aria-label={activeName}
        title={activeName}
        className="mx-auto flex size-10 items-center justify-center rounded-xl border bg-card text-body outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 can-hover:hover:text-foreground"
      >
        <span aria-hidden="true" className="text-xs font-semibold uppercase">
          {locale}
        </span>
      </button>
    )
  }

  return (
    <SegmentedControl
      options={options}
      value={locale}
      onChange={(next) => void setLocale(next)}
      ariaLabel={t('nav.languageGroup')}
    />
  )
}
