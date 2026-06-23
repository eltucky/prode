import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

const MONTH_ABBR: Record<string, string[]> = {
  es: ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isMember = group.members.some(m => m.userId === session.user!.id)
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const memberIds = group.members.map(m => m.userId)

  const playedPredictions = await prisma.prediction.findMany({
    where: { userId: { in: memberIds }, points: { not: null } },
    select: {
      userId: true,
      points: true,
      matchId: true,
      match: {
        select: {
          scheduledAt: true,
          homeScore: true,
          awayScore: true,
          homeTeam: { select: { flag: true } },
          awayTeam: { select: { flag: true } },
        },
      },
    },
  })

  const locale = await getLocale()
  const fmtDay = (iso: string) => {
    const [, m, d] = iso.split('-').map(Number)
    return `${d} ${MONTH_ABBR[locale][m]}`
  }

  const sorted = [...playedPredictions].sort((a, b) => {
    const dt = a.match.scheduledAt.getTime() - b.match.scheduledAt.getTime()
    return dt !== 0 ? dt : a.matchId.localeCompare(b.matchId)
  })

  type SnapEntry = { userId: string; name: string; image: string | null; points: number; rank: number }
  type Snapshot = { key: string; label: string; standings: SnapEntry[] }

  const makeSnap = (cumPts: Map<string, number>, cumOk: Map<string, number>): SnapEntry[] =>
    group.members
      .map(m => ({
        userId: m.userId,
        name: m.user.name ?? '',
        image: m.user.image ?? null,
        points: cumPts.get(m.userId) ?? 0,
        correctCount: cumOk.get(m.userId) ?? 0,
      }))
      .sort((a, b) => b.points - a.points || b.correctCount - a.correctCount)
      .map((e, i) => ({ userId: e.userId, name: e.name, image: e.image, points: e.points, rank: i + 1 }))

  // Per-match history
  const matchHistory: Snapshot[] = []
  const mPts = new Map<string, number>()
  const mOk = new Map<string, number>()
  const matchOrder: string[] = []
  const byMatch = new Map<string, typeof sorted>()

  for (const p of sorted) {
    if (!byMatch.has(p.matchId)) {
      matchOrder.push(p.matchId)
      byMatch.set(p.matchId, [])
    }
    byMatch.get(p.matchId)!.push(p)
  }

  for (const matchId of matchOrder) {
    const preds = byMatch.get(matchId)!
    for (const p of preds) {
      mPts.set(p.userId, (mPts.get(p.userId) ?? 0) + (p.points ?? 0))
      mOk.set(p.userId, (mOk.get(p.userId) ?? 0) + ((p.points ?? 0) > 0 ? 1 : 0))
    }
    const first = preds[0].match
    const label = `${first.homeTeam?.flag ?? ''} ${first.homeScore ?? '?'}-${first.awayScore ?? '?'} ${first.awayTeam?.flag ?? ''}`
    matchHistory.push({ key: matchId, label, standings: makeSnap(mPts, mOk) })
  }

  // Per-day history
  const dayHistory: Snapshot[] = []
  const dPts = new Map<string, number>()
  const dOk = new Map<string, number>()
  const dayOrder: string[] = []
  const byDay = new Map<string, typeof sorted>()

  for (const p of sorted) {
    const date = p.match.scheduledAt.toISOString().split('T')[0]
    if (!byDay.has(date)) {
      dayOrder.push(date)
      byDay.set(date, [])
    }
    byDay.get(date)!.push(p)
  }

  for (const date of dayOrder) {
    for (const p of byDay.get(date)!) {
      dPts.set(p.userId, (dPts.get(p.userId) ?? 0) + (p.points ?? 0))
      dOk.set(p.userId, (dOk.get(p.userId) ?? 0) + ((p.points ?? 0) > 0 ? 1 : 0))
    }
    dayHistory.push({ key: date, label: fmtDay(date), standings: makeSnap(dPts, dOk) })
  }

  return NextResponse.json({ matchHistory, dayHistory })
}
