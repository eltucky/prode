import Link from 'next/link'
import Image from 'next/image'
import { auth, signOut } from '@/auth'
import { SubmitButton } from '@/components/submit-button'
import { NavLinks } from '@/components/nav-links'

export default async function Navbar() {
  const session = await auth()

  return (
    <nav className="border-b bg-white px-4 py-3 flex items-center justify-between">
      <Link href={session ? '/torneo' : '/'} className="font-bold text-lg flex items-center gap-2">
        <span>⚽</span>
        <span>Prode 2026</span>
      </Link>

      {session?.user ? (
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-4">
            <NavLinks isSuperAdmin={session.user.isSuperAdmin ?? false} />
          </div>
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? ''}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <Link href="/perfil" className="hidden md:block text-sm text-gray-600 hover:text-gray-900">
            {session.user.name}
          </Link>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <SubmitButton className="hidden md:block text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Salir
            </SubmitButton>
          </form>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Link href="/torneo" className="text-sm text-gray-600 hover:text-gray-900">
            Torneo
          </Link>
          <Link href="/reglas" className="text-sm text-gray-600 hover:text-gray-900">
            Reglas
          </Link>
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Iniciar sesión
          </Link>
        </div>
      )}
    </nav>
  )
}
