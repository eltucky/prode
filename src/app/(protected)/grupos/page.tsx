import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { SubmitButton } from '@/components/submit-button'
import { createGroup, joinGroup } from './actions'
import { getLocale, getDictionary, t } from '@/lib/i18n'

export default async function GruposPage() {
  const session = await auth()

  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session!.user!.id },
    include: {
      group: {
        include: { _count: { select: { members: true } } },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  const inputClass = "flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
  const inputStyle = {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {dict.grupos.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {t(dict.grupos.welcome, { name: session?.user?.name ?? '' })}
        </p>
      </div>

      {memberships.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ group }) => (
            <Link
              key={group.id}
              href={`/grupos/${group.id}`}
              className="rounded-xl px-5 py-4 block transition-colors hover:brightness-110"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {group.name}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {group._count.members}{' '}
                {group._count.members === 1 ? dict.grupos.memberSingular : dict.grupos.memberPlural}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-4xl mb-3">🏆</div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {dict.grupos.emptyTitle}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {dict.grupos.emptySubtitle}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            {dict.grupos.createTitle}
          </h2>
          <form action={createGroup} className="flex gap-2">
            <input
              name="name"
              type="text"
              placeholder={dict.grupos.createPlaceholder}
              required
              maxLength={50}
              className={inputClass}
              style={inputStyle}
            />
            <SubmitButton
              className="rounded-lg px-4 py-2 text-sm font-bold shrink-0 transition-colors"
              style={{ background: 'var(--accent)', color: '#000' } as React.CSSProperties}
            >
              {dict.grupos.createButton}
            </SubmitButton>
          </form>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            {dict.grupos.joinTitle}
          </h2>
          <form action={joinGroup} className="flex gap-2">
            <input
              name="inviteCode"
              type="text"
              placeholder={dict.grupos.joinPlaceholder}
              required
              className={inputClass}
              style={inputStyle}
            />
            <SubmitButton
              className="rounded-lg px-4 py-2 text-sm font-bold shrink-0 transition-colors"
              style={{ background: 'var(--accent)', color: '#000' } as React.CSSProperties}
            >
              {dict.grupos.joinButton}
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  )
}
