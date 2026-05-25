'use client'

import { useTransition, useState } from 'react'
import { savePrediction, deletePrediction } from '@/app/(protected)/torneo/actions'

type Team = { flag: string; name: string }

type Props = {
  matchId: string
  prediction: { homeScore: number; awayScore: number; predictedWinnerId: string | null } | null
  homeTeam: Team | null
  awayTeam: Team | null
  homeTeamId: string | null
  awayTeamId: string | null
  isKnockout: boolean
}

export function PredictionForm({ matchId, prediction, homeTeam, awayTeam, homeTeamId, awayTeamId, isKnockout }: Props) {
  const [isPending, startTransition] = useTransition()
  const [homeScore, setHomeScore] = useState(prediction?.homeScore?.toString() ?? '')
  const [awayScore, setAwayScore] = useState(prediction?.awayScore?.toString() ?? '')
  const [winnerId, setWinnerId] = useState(prediction?.predictedWinnerId ?? '')
  const [confirming, setConfirming] = useState(false)

  const savedHome = prediction?.homeScore?.toString() ?? ''
  const savedAway = prediction?.awayScore?.toString() ?? ''
  const savedWinner = prediction?.predictedWinnerId ?? ''
  const isDirty = homeScore !== savedHome || awayScore !== savedAway || winnerId !== savedWinner

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => savePrediction(formData))
  }

  function handleDelete() {
    setConfirming(false)
    startTransition(() => deletePrediction(matchId))
  }

  return (
    <form onSubmit={handleSave} className="flex items-center gap-2 border-t pt-2 flex-wrap">
      <input type="hidden" name="matchId" value={matchId} />
      <span className="text-xs text-gray-400 shrink-0">Tu pronóstico:</span>
      <input
        type="number"
        name="homeScore"
        value={homeScore}
        onChange={e => setHomeScore(e.target.value)}
        min="0"
        max="99"
        required
        placeholder="L"
        className="w-12 border rounded px-1 py-0.5 text-center text-sm"
      />
      <span className="text-gray-400">-</span>
      <input
        type="number"
        name="awayScore"
        value={awayScore}
        onChange={e => setAwayScore(e.target.value)}
        min="0"
        max="99"
        required
        placeholder="V"
        className="w-12 border rounded px-1 py-0.5 text-center text-sm"
      />
      {isKnockout && homeTeam && awayTeam && (
        <select
          name="predictedWinnerId"
          value={winnerId}
          onChange={e => setWinnerId(e.target.value)}
          className="border rounded px-1 py-0.5 text-xs"
        >
          <option value="">Ganador...</option>
          <option value={homeTeamId!}>{homeTeam.flag} {homeTeam.name}</option>
          <option value={awayTeamId!}>{awayTeam.flag} {awayTeam.name}</option>
        </select>
      )}
      <button
        type="submit"
        disabled={!isDirty || isPending}
        className="bg-gray-900 text-white px-3 py-0.5 rounded text-xs hover:bg-gray-700 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {prediction ? 'Actualizar' : 'Guardar'}
      </button>
      {prediction && !confirming && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={isPending}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
        >
          Borrar
        </button>
      )}
      {confirming && (
        <>
          <span className="text-xs text-gray-500">¿Borrar pronóstico?</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-red-600 font-semibold hover:text-red-800 disabled:opacity-40"
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            No
          </button>
        </>
      )}
    </form>
  )
}
