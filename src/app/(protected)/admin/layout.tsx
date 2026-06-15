import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/admin/partidos', label: 'Partidos' },
  { href: '/admin/grupos', label: 'Grupos' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/admin/pronosticos', label: 'Pronósticos' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) redirect('/grupos')

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-zinc-800 pb-0">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 border-b-2 border-transparent hover:border-zinc-500 -mb-px"
          >
            {item.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}
