// src/components/nav-links.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/torneo', label: 'Torneo' },
  { href: '/grupos', label: 'Grupos' },
  { href: '/reglas', label: 'Reglas' },
]

export function NavLinks({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-4">
      {LINKS.map(({ href, label }) => {
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="text-sm font-medium transition-colors"
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {label}
          </Link>
        )
      })}
      {isSuperAdmin && (
        <Link
          href="/admin/partidos"
          className="text-sm font-medium transition-colors"
          style={{ color: pathname.startsWith('/admin') ? '#ef4444' : '#f87171' }}
        >
          Admin
        </Link>
      )}
    </div>
  )
}
