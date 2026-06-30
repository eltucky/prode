// src/components/match-card.tsx
import { MatchStage, MatchStatus } from '@prisma/client'
import { ClientDate } from '@/components/client-date'
import { PredictionInput } from '@/components/prediction-input'
import Link from 'next/link'
import type { Dictionary } from '@/lib/i18n'

type Team = { flag: string; name: string } | null

type Match = {
  id: string
  stage: MatchStage
  status: MatchStatus
  scheduledAt: Date
  homeScore: number | null
  awayScore: number | null
  homeTeamId: string | null
  awayTeamId: string | null
  groupName: string | null
  homeTeam: Team
  awayTeam: Team
}

type Prediction = {
  homeScore: number
  awayScore: number
  predictedWinnerId: string | null
  points: number | null
} | null

type Props = {
  match: Match
  prediction: Prediction
  hasSession: boolean
  showGroupLabel: boolean
  locked: boolean
  isKnockout: boolean
  dict: Dictionary
}

export function MatchCard({ match, prediction, hasSession, showGroupLabel, locked, isKnockout, dict }: Props) {
  const badge = {
    SCHEDULED:   { label: dict.match.statusScheduled, bg: 'var(--surface-raised)', color: 'var(--text-muted)' },
    IN_PROGRESS: { label: dict.match.statusInProgress, bg: '#fbbf2422',            color: '#fbbf24' },
    FINISHED:    { label: dict.match.statusFinished,   bg: '#22c55e1a',             color: 'var(--accent)' },
    POSTPONED:   { label: dict.match.statusPostponed,  bg: '#ef44441a',             color: '#ef4444' },
    CANCELLED:   { label: dict.match.statusCancelled,  bg: '#ef44441a',             color: '#ef4444' },
  }[match.status]

  const hasPrediction = prediction !== null

  return (
    <div
      id={match.id}
      className="rounded-xl px-4 py-3 space-y-3"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hasPrediction && !locked ? '#22c55e40' : 'var(--border)'}`,
      }}
    >
      {/* Header row — links to match detail */}
      <Link
        href={`/torneo/${match.id}`}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex flex-col min-w-0">
          {showGroupLabel && match.groupName && (
            <span className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {dict.torneo.groupLabel.replace('{name}', match.groupName)}
            </span>
          )}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {match.homeTeam ? `${match.homeTeam.flag} ${match.homeTeam.name}` : 'TBD'}
            </span>
            <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
              {match.status === 'FINISHED'
                ? `${match.homeScore} - ${match.awayScore}`
                : 'vs'}
            </span>
            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {match.awayTeam ? `${match.awayTeam.flag} ${match.awayTeam.name}` : 'TBD'}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0 gap-1">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <ClientDate iso={match.scheduledAt.toISOString()} />
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>›</span>
        </div>
      </Link>

      {/* Bottom row: prediction area */}
      {match.status !== 'CANCELLED' && (
        <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {locked ? (
            prediction ? (
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{dict.match.yourPrediction}</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {prediction.homeScore} - {prediction.awayScore}
                </span>
                {isKnockout && prediction.predictedWinnerId && prediction.homeScore === prediction.awayScore && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {'('}
                    {dict.match.winner.replace('{name}',
                      prediction.predictedWinnerId === match.homeTeamId
                        ? (match.homeTeam?.name ?? '')
                        : (match.awayTeam?.name ?? '')
                    )}
                    {')'}
                  </span>
                )}
                {prediction.points !== null && (
                  <span
                    className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: prediction.points > 0 ? '#22c55e1a' : 'var(--surface-raised)',
                      color: prediction.points > 0 ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {prediction.points > 0 ? '+' : ''}{prediction.points} pts
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{dict.match.noPrediction}</span>
            )
          ) : hasSession ? (
            <PredictionInput
              key={match.id}
              matchId={match.id}
              prediction={prediction}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              homeTeamId={match.homeTeamId}
              awayTeamId={match.awayTeamId}
              isKnockout={isKnockout}
              scheduledAt={match.scheduledAt.toISOString()}
            />
          ) : (
            <Link href="/login" className="text-xs" style={{ color: '#3b82f6' }}>
              {dict.match.loginToPredict}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
