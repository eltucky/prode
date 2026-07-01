'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDict } from '@/components/locale-provider'
import { useLastGroupHref } from '@/components/use-last-group-href'

export function NavLinks({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname()
  const dict = useDict()
  const gruposHref = useLastGroupHref()

  const LINKS = [
    { href: '/torneo', matchHref: '/torneo', label: dict.nav.torneo },
    { href: gruposHref, matchHref: '/grupos', label: dict.nav.grupos },
    { href: '/reglas', matchHref: '/reglas', label: dict.nav.reglas },
  ]

  return (
    <div className="flex items-center gap-4">
      {LINKS.map(({ href, matchHref, label }) => {
        const isActive = pathname.startsWith(matchHref)
        return (
          <Link
            key={matchHref}
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
