import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { updateEmailNotifications } from './actions'
import { SubmitButton } from '@/components/submit-button'
import { getLocale, getDictionary } from '@/lib/i18n'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, emailNotifications: true },
  })
  if (!user) redirect('/login')

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {dict.perfil.title}
      </h1>

      {/* Hero */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={user.name ?? ''}
            width={48}
            height={48}
            className="rounded-full shrink-0"
            style={{ border: '2px solid var(--accent)' }}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-xl"
            style={{ background: 'var(--surface-raised)', border: '2px solid var(--accent)' }}
          >
            👤
          </div>
        )}
        <div>
          <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{user.name}</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
        </div>
      </div>

      {/* Notificaciones */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {dict.perfil.notificationsTitle}
        </h2>
        <form action={updateEmailNotifications} className="space-y-4">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                {dict.perfil.notificationsLabel}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {dict.perfil.notificationsDescription}
              </div>
            </div>
            <input
              type="checkbox"
              name="emailNotifications"
              defaultChecked={user.emailNotifications}
              className="mt-1 w-5 h-5 shrink-0"
              style={{ accentColor: 'var(--accent)' }}
            />
          </label>
          <SubmitButton
            className="w-full rounded-xl py-2.5 text-sm font-bold transition-colors"
            style={{ background: 'var(--accent)', color: '#000' } as React.CSSProperties}
          >
            {dict.perfil.saveButton}
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}
