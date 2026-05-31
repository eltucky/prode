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
            className={`text-sm transition-colors ${
              isActive
                ? 'text-gray-900 font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {label}
          </Link>
        )
      })}
      {isSuperAdmin && (
        <Link
          href="/admin/partidos"
          className={`text-sm transition-colors ${
            pathname.startsWith('/admin')
              ? 'text-red-700 font-semibold'
              : 'text-red-500 hover:text-red-700'
          }`}
        >
          Admin
        </Link>
      )}
    </div>
  )
}
