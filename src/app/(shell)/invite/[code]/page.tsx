import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SubmitButton } from '@/components/submit-button'
import { joinViaInvite } from './actions'
import { getLocale, getDictionary } from '@/lib/i18n'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const session = await auth()

  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const group = await prisma.group.findUnique({
    where: { inviteCode: code },
    include: { _count: { select: { members: true } } },
  })

  // State 1: invalid code
  if (!group) {
    return (
      <div className="max-w-sm mx-auto text-center space-y-4 py-16">
        <div className="text-4xl" aria-hidden="true">🔗</div>
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          {dict.invite.invalidTitle}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {dict.invite.invalidDescription}
        </p>
        <Link
          href="/torneo"
          className="inline-block text-sm font-medium"
          style={{ color: 'var(--accent)' }}
        >
          {dict.invite.viewTournament}
        </Link>
      </div>
    )
  }

  // State 2: already a member → redirect silently
  if (session?.user?.id) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
    })
    if (membership) redirect(`/grupos/${group.id}`)
  }

  const memberCount = group._count.members

  return (
    <div className="max-w-sm mx-auto text-center space-y-6 py-16">
      <div className="text-4xl" aria-hidden="true">🏆</div>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {group.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {memberCount} {memberCount === 1 ? dict.invite.memberSingular : dict.invite.memberPlural}
        </p>
      </div>

      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {session
            ? dict.invite.loggedInDescription
            : dict.invite.guestDescription}
        </p>

        {/* State 4: logged in, not yet a member */}
        {session && (
          <form action={joinViaInvite.bind(null, code)}>
            <SubmitButton
              className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-colors"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              {dict.invite.joinButton}
            </SubmitButton>
          </form>
        )}

        {/* State 3: not logged in */}
        {!session && (
          <Link
            href={`/login?callbackUrl=/invite/${code}`}
            className="block w-full rounded-xl px-4 py-3 text-sm font-bold text-center transition-colors"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            {dict.invite.loginToJoin}
          </Link>
        )}
      </div>
    </div>
  )
}
