'use client'

import type { Ref } from 'react'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { useLocale } from '@/lib/i18n/client'

export function PrivacyConsent({
  checked,
  error = false,
  onChange,
  inputRef,
}: {
  checked: boolean
  error?: boolean
  onChange: (checked: boolean) => void
  inputRef?: Ref<HTMLInputElement>
}) {
  const { t } = useLocale()

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2.5">
        <input
          ref={inputRef}
          id="consent"
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error || undefined}
          aria-describedby={error ? 'consent-error' : undefined}
          className="mt-0.5 size-4 shrink-0 accent-foreground"
        />
        <Label htmlFor="consent" className="block font-normal leading-5 text-body">
          {t('auth.consentPrefix')}
          <Link href="/privacy" target="_blank" className="text-link underline-offset-4 can-hover:hover:underline">
            {t('auth.consentLink')}
          </Link>
          {t('auth.consentSuffix')}
        </Label>
      </div>
      {error && (
        <p id="consent-error" role="alert" className="text-sm text-destructive">
          {t('auth.consentRequired')}
        </p>
      )}
    </div>
  )
}
