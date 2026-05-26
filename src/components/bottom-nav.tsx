'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOutAction } from '@/app/actions'

const TABS = [
  { href: '/torneo', label: 'Torneo', icon: '🏟️' },
  { href: '/grupos', label: 'Grupos', icon: '👥' },
  { href: '/reglas', label: 'Reglas', icon: '📋' },
  { href: '/perfil', label: 'Perfil', icon: '👤' },
]

export default function BottomNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      {moreOpen && (
        <div
          data-testid="more-overlay"
          className="fixed inset-0 z-40"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="fixed bottom-16 right-0 z-50 bg-white border border-gray-200 rounded-tl-xl shadow-lg min-w-40 md:hidden">
          {isSuperAdmin && (
            <Link
              href="/admin/partidos"
              className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-gray-50 border-b border-gray-100"
              onClick={() => setMoreOpen(false)}
            >
              Admin
            </Link>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 w-full text-left"
            >
              Salir
            </button>
          </form>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
        <div className="flex justify-around items-center py-1 pb-2">
          {TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-14 text-xs ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
              </Link>
            )
          })}

          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-14 text-xs ${
              moreOpen ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl leading-none">···</span>
            <span>Más</span>
          </button>
        </div>
      </nav>
    </>
  )
}
