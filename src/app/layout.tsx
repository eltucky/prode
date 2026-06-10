import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { LocaleProvider } from '@/components/locale-provider'
import { getLocale, getDictionary } from '@/lib/i18n'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Prode Mundial 2026',
  description: 'Jugá al prode del Mundial FIFA 2026 con tus amigos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Prode 2026',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const dict = await getDictionary(locale)

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <LocaleProvider locale={locale} dict={dict}>
          {children}
        </LocaleProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
