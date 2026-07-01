// src/components/bottom-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOutAction } from '@/app/actions'
import { SubmitButton } from '@/components/submit-button'
import { useDict } from '@/components/locale-provider'
import { useLastGroupHref } from '@/components/use-last-group-href'

export default function BottomNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const dict = useDict()
  const gruposHref = useLastGroupHref()

  const TABS = [
    { href: '/torneo', matchHref: '/torneo', label: dict.nav.torneo, icon: '🏟️' },
    { href: gruposHref, matchHref: '/grupos', label: dict.nav.grupos, icon: '👥' },
    { href: '/reglas', matchHref: '/reglas', label: dict.nav.reglas, icon: '📋' },
  ]

  return (
    <>
      {moreOpen && (
        <div
          data-testid="more-overlay"
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div
          className="fixed bottom-16 right-0 z-50 border rounded-tl-xl shadow-lg min-w-40 md:hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {isSuperAdmin && (
            <Link
              href="/admin/partidos"
              className="flex items-center gap-2 px-4 py-3 text-sm border-b"
              style={{ color: '#ef4444', borderColor: 'var(--border)' }}
              onClick={() => setMoreOpen(false)}
            >
              Admin
            </Link>
          )}
          <form action={signOutAction}>
            <SubmitButton
              className="flex items-center gap-2 px-4 py-3 text-sm w-full text-left"
              style={{ color: 'var(--text-muted)' } as React.CSSProperties}
            >
              {dict.nav.signOut}
            </SubmitButton>
          </form>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex justify-around items-center py-1 pb-2">
          {TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.matchHref)
            return (
              <Link
                key={tab.matchHref}
                href={tab.href}
                className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-14 text-xs"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
                {isActive && (
                  <span
                    className="w-1 h-1 rounded-full mt-0.5"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </Link>
            )
          })}

          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-14 text-xs"
            style={{ color: moreOpen ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <span className="text-xl leading-none">···</span>
            <span>{dict.nav.more}</span>
          </button>
        </div>
      </nav>
    </>
  )
}
