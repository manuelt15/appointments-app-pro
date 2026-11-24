import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, t } from '@/lib/i18n'
import { richText } from '@/lib/i18n/rich'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return { title: t(locale, 'privacy.title') }
}

// The legal text keeps the bold lead of each paragraph marked inside the
// dictionary entry (`richText`), so both languages keep the same structure and
// the same brackets around the placeholders.
const LEGAL_STRONG = { strong: 'font-medium text-foreground' }

export default async function PrivacyPage() {
  const locale = await getLocale()

  return (
    <main className="flex min-h-dvh justify-center bg-background px-4 py-16">
      <article className="w-full max-w-xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold tracking-[-0.02em]">Shift App</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">{t(locale, 'privacy.title')}</h1>
          <p className="text-sm leading-6 text-body">
            {t(locale, 'privacy.intro')}
          </p>
        </header>

        <section aria-labelledby="privacy-controller" className="space-y-3">
          <h2 id="privacy-controller" className="text-xl font-semibold tracking-[-0.02em]">
            {t(locale, 'privacy.controllerTitle')}
          </h2>
          <p className="text-sm leading-6 text-body">
            {richText(t(locale, 'privacy.controllerBody'), LEGAL_STRONG)}
          </p>
        </section>

        <section aria-labelledby="privacy-data" className="space-y-3">
          <h2 id="privacy-data" className="text-xl font-semibold tracking-[-0.02em]">
            {t(locale, 'privacy.dataTitle')}
          </h2>
          <p className="text-sm leading-6 text-body">
            {t(locale, 'privacy.dataIntro')}
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-body">
            <li>{richText(t(locale, 'privacy.dataAccount'), LEGAL_STRONG)}</li>
            <li>{richText(t(locale, 'privacy.dataEmployees'), LEGAL_STRONG)}</li>
          </ul>
        </section>

        <section aria-labelledby="privacy-retention" className="space-y-3">
          <h2 id="privacy-retention" className="text-xl font-semibold tracking-[-0.02em]">
            {t(locale, 'privacy.retentionTitle')}
          </h2>
          <p className="text-sm leading-6 text-body">
            {t(locale, 'privacy.retentionBody')}
          </p>
        </section>

        <section aria-labelledby="privacy-recipients" className="space-y-3">
          <h2 id="privacy-recipients" className="text-xl font-semibold tracking-[-0.02em]">
            {t(locale, 'privacy.recipientsTitle')}
          </h2>
          <p className="text-sm leading-6 text-body">
            {t(locale, 'privacy.recipientsBody')}
          </p>
        </section>

        <section aria-labelledby="privacy-rights" className="space-y-3">
          <h2 id="privacy-rights" className="text-xl font-semibold tracking-[-0.02em]">
            {t(locale, 'privacy.rightsTitle')}
          </h2>
          <p className="text-sm leading-6 text-body">
            {richText(t(locale, 'privacy.rightsBody'), LEGAL_STRONG)}
          </p>
        </section>

        <section aria-labelledby="privacy-complaint" className="space-y-3">
          <h2 id="privacy-complaint" className="text-xl font-semibold tracking-[-0.02em]">
            {t(locale, 'privacy.complaintTitle')}
          </h2>
          <p className="text-sm leading-6 text-body">
            {t(locale, 'privacy.complaintPrefix')}
            <a
              href="https://www.aepd.es"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link underline-offset-4 can-hover:hover:underline"
            >
              www.aepd.es
            </a>
            {t(locale, 'privacy.complaintSuffix')}
          </p>
        </section>

        <aside
          aria-labelledby="privacy-draft"
          className="space-y-2 rounded-lg border border-warning bg-card p-4"
        >
          <p id="privacy-draft" className="text-sm font-medium text-foreground">
            {t(locale, 'privacy.draftTitle')}
          </p>
          <p className="text-sm leading-6 text-body">
            {t(locale, 'privacy.draftBody')}
          </p>
          <p className="text-sm leading-6 text-body">
            {richText(t(locale, 'privacy.healthBody'), LEGAL_STRONG)}
          </p>
        </aside>

        <footer className="space-y-2">
          <p className="text-xs text-faint">{t(locale, 'privacy.lastUpdated')}</p>
          <p className="text-sm text-body">
            {t(locale, 'privacy.backPrefix')}
            <Link href="/login" className="text-link underline-offset-4 can-hover:hover:underline">
              {t(locale, 'privacy.backLink')}
            </Link>
            {t(locale, 'privacy.backSuffix')}
          </p>
        </footer>
      </article>
    </main>
  )
}
