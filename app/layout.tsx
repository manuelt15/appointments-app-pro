import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeScript, ThemedToaster } from '@/components/layout/theme'
import { getLocale } from '@/lib/i18n'
import { LocaleProvider } from '@/lib/i18n/client'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Staff Schedule',
  description: 'Employee shift scheduling',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={`h-full ${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <LocaleProvider locale={locale}>
          {children}
          <ThemedToaster />
        </LocaleProvider>
      </body>
    </html>
  )
}
