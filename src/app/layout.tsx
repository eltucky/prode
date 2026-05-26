import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
