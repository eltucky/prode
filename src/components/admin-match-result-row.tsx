'use client'

import { useTransition, useState } from 'react'
import { updateMatchResult, clearMatchResult } from '@/app/(protected)/admin/partidos/actions'
import { MatchStatus } from '@prisma/client'

type Team = { id: string; name: string; flag: string }

type Props = {
  matchId: string
  homeScore: number | null
  awayScore: number | null
  winnerId: string | null
  status: MatchStatus
  isKnockout: boolean
  homeTeam: Team | null
  awayTeam: Team | null
}

export function AdminMatchResultRow({ matchId, homeScore, awayScore, winnerId: currentWinnerId, status, isKnockout, homeTeam, awayTeam }: Props) {
  const [isPending, startTransition] = useTransition()
  const savedHome = homeScore?.toString() ?? ''
  const savedAway = awayScore?.toString() ?? ''

  const [home, setHome] = useState(savedHome)
  const [away, setAway] = useState(savedAway)
  const [winnerId, setWinnerId] = useState(currentWinnerId ?? '')
  const [matchStatus, setMatchStatus] = useState<MatchStatus>(status)
  const [confirming, setConfirming] = useState(false)

  const hasScores = home !== '' && away !== ''
  const isDraw = hasScores && parseInt(home, 10) === parseInt(away, 10)
  const showWinnerSelect = isKnockout && isDraw && !!homeTeam && !!awayTeam

  const isDirty =
    home !== savedHome ||
    away !== savedAway ||
    matchStatus !== status ||
    (showWinnerSelect && winnerId !== (currentWinnerId ?? ''))
  const disabled = !isDirty || isPending || (matchStatus === 'FINISHED' && !hasScores)

  function handleHomeChange(val: string) {
    setHome(val)
    if (val !== '' && away !== '') setMatchStatus('FINISHED')
  }

  function handleAwayChange(val: string) {
    setAway(val)
    if (val !== '' && home !== '') setMatchStatus('FINISHED')
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => updateMatchResult(formData))
  }

  function handleClear() {
    setConfirming(false)
    startTransition(() => clearMatchResult(matchId))
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="matchId" value={matchId} />
      <div className="flex items-center gap-1 flex-wrap">
        <input
          type="number"
          name="homeScore"
          value={home}
          onChange={e => handleHomeChange(e.target.value)}
          min="0"
          placeholder="L"
          className="w-12 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-1 py-0.5 text-center text-sm"
        />
        <span>-</span>
        <input
          type="number"
          name="awayScore"
          value={away}
          onChange={e => handleAwayChange(e.target.value)}
          min="0"
          placeholder="V"
          className="w-12 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-1 py-0.5 text-center text-sm"
        />
        {showWinnerSelect && (
          <select
            name="winnerId"
            value={winnerId}
            onChange={e => setWinnerId(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-1 py-0.5 text-xs"
          >
            <option value="">Penales...</option>
            <option value={homeTeam!.id}>{homeTeam!.flag} {homeTeam!.name}</option>
            <option value={awayTeam!.id}>{awayTeam!.flag} {awayTeam!.name}</option>
          </select>
        )}
        <select
          name="status"
          value={matchStatus}
          onChange={e => setMatchStatus(e.target.value as MatchStatus)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-1 py-0.5 text-xs"
        >
          <option value="SCHEDULED">SCHED</option>
          <option value="IN_PROGRESS">LIVE</option>
          <option value="FINISHED">FIN</option>
          <option value="POSTPONED">POST</option>
          <option value="CANCELLED">CANC</option>
        </select>
        <button
          type="submit"
          disabled={disabled}
          className="bg-zinc-700 text-zinc-100 px-2 py-0.5 rounded text-xs hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ✓
        </button>
        {homeScore !== null && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={isPending}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
          >
            ✕
          </button>
        )}
        {confirming && (
          <span className="flex items-center gap-1">
            <span className="text-xs text-zinc-500">¿Borrar?</span>
            <button
              type="button"
              onClick={handleClear}
              disabled={isPending}
              className="text-xs text-red-400 font-semibold hover:text-red-300 disabled:opacity-40"
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              No
            </button>
          </span>
        )}
      </div>
    </form>
  )
}
