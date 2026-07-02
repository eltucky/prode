import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { LocaleProvider } from '@/components/locale-provider'
import { getLocale, getDictionary } from '@/lib/i18n'
import { getTheme } from '@/lib/theme'
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

const THEME_COLORS = {
  dark: '#2563eb',
  light: '#2563eb',
  pokemon: '#ff6a00',
}

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme()
  return { themeColor: THEME_COLORS[theme] }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const theme = await getTheme()

  return (
    <html lang={locale} data-theme={theme}>
      <body className={inter.className}>
        <LocaleProvider locale={locale} dict={dict}>
          {children}
        </LocaleProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
