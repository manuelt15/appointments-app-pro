import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy notice' }

export default function PrivacyPage() {
  return (
    <main className="flex min-h-dvh justify-center bg-background px-4 py-16">
      <article className="w-full max-w-xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold tracking-[-0.02em]">Shift App</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Privacy notice</h1>
          <p className="text-sm leading-6 text-body">
            This notice explains, in plain language, what personal data this application handles, for
            what purpose, for how long and who it reaches. It covers the business accounts of the
            service and the employees whose data those accounts manage.
          </p>
        </header>

        <section aria-labelledby="privacy-controller" className="space-y-3">
          <h2 id="privacy-controller" className="text-xl font-semibold tracking-[-0.02em]">
            Who is the data controller
          </h2>
          <p className="text-sm leading-6 text-body">
            The data controller is{' '}
            <strong className="font-medium text-foreground">[RESPONSABLE LEGAL]</strong>. The legal
            name, tax ID and contact details will be published in this section before the service
            opens to the public.
          </p>
        </section>

        <section aria-labelledby="privacy-data" className="space-y-3">
          <h2 id="privacy-data" className="text-xl font-semibold tracking-[-0.02em]">
            What data we process and why
          </h2>
          <p className="text-sm leading-6 text-body">
            We only process the data the service needs to work.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-body">
            <li>
              <strong className="font-medium text-foreground">Your business account.</strong> When
              you create an account we process your name, your email address and the password you
              choose, stored only as an irreversible hash, plus the name and time zone of your
              business. Purpose: to create the account, sign you in and link the schedule to your
              business. Legal basis: the contract with you (GDPR art. 6.1.b).
            </li>
            <li>
              <strong className="font-medium text-foreground">Your employees&apos; data.</strong> When
              you add an employee to the schedule we process their full name and, optionally, their
              email address, phone number, birthday and start date, together with the shifts and
              absences assigned to them: dates, times, type of absence and any notes you add.
              Purpose: to build and show the work schedule; the birthday is marked on the schedule
              every year. Legal basis: the legitimate interest of the business in organizing its
              staff schedule (GDPR art. 6.1.f). If you manage a business account, informing your
              employees and having a valid reason to add them is your responsibility.
            </li>
          </ul>
        </section>

        <section aria-labelledby="privacy-retention" className="space-y-3">
          <h2 id="privacy-retention" className="text-xl font-semibold tracking-[-0.02em]">
            How long we keep it
          </h2>
          <p className="text-sm leading-6 text-body">
            Account data is kept while the account is active. When an employee is deleted, their
            record is anonymized immediately: email, phone number and birthday are erased.
            Historical shifts are kept and stay linked to that anonymized record, so the schedule
            history and the PDF exports remain readable. Only the name remains attached to those
            past shifts.
          </p>
        </section>

        <section aria-labelledby="privacy-recipients" className="space-y-3">
          <h2 id="privacy-recipients" className="text-xl font-semibold tracking-[-0.02em]">
            Who receives your data
          </h2>
          <p className="text-sm leading-6 text-body">
            The data is stored with the providers needed to run this service: the application
            hosting provider and the database provider. If you sign in with Google or GitHub, that
            provider takes part in identifying you. We do not sell personal data, we do not share
            it for advertising, and we do not use analytics or marketing trackers.
          </p>
        </section>

        <section aria-labelledby="privacy-rights" className="space-y-3">
          <h2 id="privacy-rights" className="text-xl font-semibold tracking-[-0.02em]">
            Your rights
          </h2>
          <p className="text-sm leading-6 text-body">
            You have the right to access your data, rectify it, delete it, restrict its processing,
            object to it and request its portability. To exercise any of these rights, write to{' '}
            <strong className="font-medium text-foreground">[EMAIL DE CONTACTO]</strong>. There is
            no self-service for these requests yet: they are handled manually and answered by
            email, normally within a month. Employees who appear in a schedule can use the same
            address.
          </p>
        </section>

        <section aria-labelledby="privacy-complaint" className="space-y-3">
          <h2 id="privacy-complaint" className="text-xl font-semibold tracking-[-0.02em]">
            Complaint to the AEPD
          </h2>
          <p className="text-sm leading-6 text-body">
            If you believe your data has not been handled correctly, you can file a complaint with
            the Spanish data protection authority, the Agencia Española de Protección de Datos
            (AEPD), at{' '}
            <a
              href="https://www.aepd.es"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link underline-offset-4 can-hover:hover:underline"
            >
              www.aepd.es
            </a>
            .
          </p>
        </section>

        <aside
          aria-labelledby="privacy-draft"
          className="space-y-2 rounded-lg border border-warning bg-card p-4"
        >
          <p id="privacy-draft" className="text-sm font-medium text-foreground">
            Draft notice, pending legal review
          </p>
          <p className="text-sm leading-6 text-body">
            This text has not been reviewed by a lawyer. Before the service opens to the public,
            the placeholders between brackets ([RESPONSABLE LEGAL] and [EMAIL DE CONTACTO]) must be
            replaced with real values and the notice must pass a legal review. Until then, treat
            this page as a draft.
          </p>
        </aside>

        <footer className="space-y-2">
          <p className="text-xs text-faint">Last updated: 24 November 2026.</p>
          <p className="text-sm text-body">
            Back to{' '}
            <Link href="/login" className="text-link underline-offset-4 can-hover:hover:underline">
              sign in
            </Link>
            .
          </p>
        </footer>
      </article>
    </main>
  )
}
