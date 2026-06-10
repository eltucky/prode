'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDict } from '@/components/locale-provider'

export function NavLinks({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname()
  const dict = useDict()

  const LINKS = [
    { href: '/torneo', label: dict.nav.torneo },
    { href: '/grupos', label: dict.nav.grupos },
    { href: '/reglas', label: dict.nav.reglas },
  ]

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
