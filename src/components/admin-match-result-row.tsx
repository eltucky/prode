'use client'

import { useTransition, useState } from 'react'
import { updateMatchResult } from '@/app/(protected)/admin/partidos/actions'
import { MatchStatus } from '@prisma/client'

type Props = {
  matchId: string
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
}

export function AdminMatchResultRow({ matchId, homeScore, awayScore, status }: Props) {
  const [isPending, startTransition] = useTransition()
  const savedHome = homeScore?.toString() ?? ''
  const savedAway = awayScore?.toString() ?? ''

  const [home, setHome] = useState(savedHome)
  const [away, setAway] = useState(savedAway)
  const [matchStatus, setMatchStatus] = useState<MatchStatus>(status)

  const isDirty = home !== savedHome || away !== savedAway || matchStatus !== status
  const scoresEmpty = home === '' || away === ''
  const disabled = !isDirty || isPending || (matchStatus === 'FINISHED' && scoresEmpty)

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

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="matchId" value={matchId} />
      <div className="flex items-center gap-1">
        <input
          type="number"
          name="homeScore"
          value={home}
          onChange={e => handleHomeChange(e.target.value)}
          min="0"
          placeholder="L"
          className="w-12 border rounded px-1 py-0.5 text-center text-sm"
        />
        <span>-</span>
        <input
          type="number"
          name="awayScore"
          value={away}
          onChange={e => handleAwayChange(e.target.value)}
          min="0"
          placeholder="V"
          className="w-12 border rounded px-1 py-0.5 text-center text-sm"
        />
        <select
          name="status"
          value={matchStatus}
          onChange={e => setMatchStatus(e.target.value as MatchStatus)}
          className="border rounded px-1 py-0.5 text-xs"
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
          className="bg-gray-800 text-white px-2 py-0.5 rounded text-xs hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ✓
        </button>
      </div>
    </form>
  )
}
