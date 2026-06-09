// src/components/navbar.tsx
import Link from 'next/link'
import Image from 'next/image'
import { auth, signOut } from '@/auth'
import { SubmitButton } from '@/components/submit-button'
import { NavLinks } from '@/components/nav-links'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { getLocale, getDictionary } from '@/lib/i18n'

export default async function Navbar() {
  const session = await auth()
  const locale = await getLocale()
  const dict = await getDictionary(locale)

  return (
    <nav
      className="px-4 py-3 flex items-center justify-between border-b"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <Link
        href={session ? '/torneo' : '/'}
        className="font-extrabold text-base flex items-center gap-2 tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        <span>⚽</span>
        <span>Prode 2026</span>
        <span
          className="text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wide"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          FIFA
        </span>
      </Link>

      {session?.user ? (
        <div className="flex items-center gap-2 md:gap-4">
          <LocaleSwitcher />
          <div className="hidden md:flex items-center gap-4">
            <NavLinks isSuperAdmin={session.user.isSuperAdmin ?? false} />
          </div>
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? ''}
              width={30}
              height={30}
              className="rounded-full border"
              style={{ borderColor: 'var(--border)' }}
            />
          )}
          <Link
            href="/perfil"
            className="hidden md:block text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {session.user.name}
          </Link>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <SubmitButton
              className="hidden md:block text-sm transition-colors"
              style={{ color: 'var(--text-muted)' } as React.CSSProperties}
            >
              {dict.nav.signOut}
            </SubmitButton>
          </form>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          {(['torneo', 'reglas'] as const).map((key) => (
            <Link
              key={key}
              href={`/${key}`}
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              {dict.nav[key]}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {dict.nav.signIn}
          </Link>
        </div>
      )}
    </nav>
  )
}
