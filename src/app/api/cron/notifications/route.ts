import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendReminderEmail, sendDailySummaryEmail } from '@/lib/email'
import type { ReminderMatch, SummaryData } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const tournamentStarted = await prisma.match.findFirst({
    where: { scheduledAt: { lte: now } },
    select: { id: true },
  })
  if (!tournamentStarted) {
    return NextResponse.json({ ok: true, skipped: 'tournament not started' })
  }

  let remindersSent = 0
  let summariesSent = 0
  const errors: string[] = []

  const windowStart = new Date(now.getTime() + 90 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 150 * 60 * 1000)

  const upcomingMatches = await prisma.match.findMany({
    where: { status: 'SCHEDULED', scheduledAt: { gte: windowStart, lte: windowEnd } },
    include: { homeTeam: true, awayTeam: true },
  })

  if (upcomingMatches.length > 0) {
    const matchIds = upcomingMatches.map(m => m.id)

    const eligibleUsers = await prisma.user.findMany({
      where: { emailNotifications: true },
      select: { id: true, name: true, email: true },
    })

    for (const user of eligibleUsers) {
      const predicted = await prisma.prediction.findMany({
        where: { userId: user.id, matchId: { in: matchIds } },
        select: { matchId: true },
      })
      const predictedIds = new Set(predicted.map(p => p.matchId))
      const unpredicted = upcomingMatches.filter(m => !predictedIds.has(m.id))
      if (unpredicted.length === 0) continue

      const reminderMatches: ReminderMatch[] = unpredicted.map(m => ({
        matchNumber: m.matchNumber,
        homeTeam: m.homeTeam?.name ?? 'TBD',
        awayTeam: m.awayTeam?.name ?? 'TBD',
        scheduledAt: m.scheduledAt,
      }))

      try {
        await sendReminderEmail(user.email, user.name ?? 'Jugador', reminderMatches)
        remindersSent++
      } catch (e) {
        errors.push(`reminder:${user.email}: ${String(e)}`)
      }
    }
  }

  if (now.getUTCHours() === 22) {
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const finishedToday = await prisma.match.findMany({
      where: { status: 'FINISHED', scheduledAt: { gte: todayStart, lt: todayEnd } },
      include: { homeTeam: true, awayTeam: true },
    })

    if (finishedToday.length > 0) {
      const matchIds = finishedToday.map(m => m.id)

      const usersToSummarize = await prisma.user.findMany({
        where: {
          emailNotifications: true,
          predictions: { some: { matchId: { in: matchIds }, points: { not: null } } },
        },
        select: {
          id: true,
          name: true,
          email: true,
          predictions: {
            where: { matchId: { in: matchIds }, points: { not: null } },
            select: { matchId: true, homeScore: true, awayScore: true, points: true },
          },
          memberships: {
            select: {
              group: {
                select: {
                  id: true,
                  name: true,
                  members: { select: { userId: true } },
                },
              },
            },
          },
        },
      })

      const finishedTodayMap = new Map(finishedToday.map(m => [m.id, m]))

      for (const user of usersToSummarize) {
        const predictionsToday = user.predictions
          .map(p => {
            const match = finishedTodayMap.get(p.matchId)
            if (!match) return null
            return {
              homeTeam: match.homeTeam?.name ?? 'TBD',
              awayTeam: match.awayTeam?.name ?? 'TBD',
              homeScore: p.homeScore,
              awayScore: p.awayScore,
              points: p.points ?? 0,
            }
          })
          .filter((p): p is Exclude<typeof p, null> => p !== null)

        const groups: SummaryData['groups'] = []
        for (const { group } of user.memberships) {
          const memberIds = group.members.map(m => m.userId)
          const allPredictions = await prisma.prediction.findMany({
            where: { userId: { in: memberIds }, points: { not: null } },
            select: { userId: true, points: true },
          })
          const totals = new Map<string, { total: number; correctCount: number }>()
          for (const p of allPredictions) {
            const entry = totals.get(p.userId) ?? { total: 0, correctCount: 0 }
            entry.total += p.points ?? 0
            entry.correctCount += (p.points ?? 0) > 0 ? 1 : 0
            totals.set(p.userId, entry)
          }
          const sorted = Array.from(totals.entries())
            .sort(([, a], [, b]) => b.total - a.total || b.correctCount - a.correctCount)
          const position = sorted.findIndex(([uid]) => uid === user.id) + 1
          groups.push({
            name: group.name,
            position: position > 0 ? position : memberIds.length,
            totalMembers: memberIds.length,
          })
        }

        try {
          await sendDailySummaryEmail(user.email, user.name ?? 'Jugador', { predictionsToday, groups })
          summariesSent++
        } catch (e) {
          errors.push(`summary:${user.email}: ${String(e)}`)
        }
      }
    }
  }

  return NextResponse.json({ ok: true, remindersSent, summariesSent, errors })
}
