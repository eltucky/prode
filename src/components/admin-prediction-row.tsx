'use client'

import { useTransition, useState } from 'react'
import { editPrediction, deletePrediction } from '@/app/(protected)/admin/pronosticos/actions'

type Team = { id: string; name: string }

type Props = {
  prediction: { id: string; homeScore: number; awayScore: number; predictedWinnerId: string | null }
  homeTeam: Team | null
  awayTeam: Team | null
  isKnockout: boolean
}

export function AdminPredictionRow({ prediction, homeTeam, awayTeam, isKnockout }: Props) {
  const [isPending, startTransition] = useTransition()
  const [homeScore, setHomeScore] = useState(prediction.homeScore.toString())
  const [awayScore, setAwayScore] = useState(prediction.awayScore.toString())
  const [winnerId, setWinnerId] = useState(prediction.predictedWinnerId ?? '')
  const [confirming, setConfirming] = useState(false)

  const isDirty =
    homeScore !== prediction.homeScore.toString() ||
    awayScore !== prediction.awayScore.toString() ||
    winnerId !== (prediction.predictedWinnerId ?? '')

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => editPrediction(formData))
  }

  function handleDelete() {
    setConfirming(false)
    const formData = new FormData()
    formData.set('predictionId', prediction.id)
    startTransition(() => deletePrediction(formData))
  }

  return (
    <div className="flex items-center gap-2">
      <form onSubmit={handleEdit} className="flex items-center gap-1">
        <input type="hidden" name="predictionId" value={prediction.id} />
        <input
          type="number"
          name="homeScore"
          value={homeScore}
          onChange={e => setHomeScore(e.target.value)}
          min="0"
          max="99"
          required
          className="w-10 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-1 py-0.5 text-center text-xs"
        />
        <span className="text-zinc-500 text-xs">-</span>
        <input
          type="number"
          name="awayScore"
          value={awayScore}
          onChange={e => setAwayScore(e.target.value)}
          min="0"
          max="99"
          required
          className="w-10 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-1 py-0.5 text-center text-xs"
        />
        {isKnockout && (
          <select
            name="predictedWinnerId"
            value={winnerId}
            onChange={e => setWinnerId(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-1 py-0.5 text-xs"
          >
            <option value="">Sin ganador</option>
            {homeTeam && <option value={homeTeam.id}>{homeTeam.name}</option>}
            {awayTeam && <option value={awayTeam.id}>{awayTeam.name}</option>}
          </select>
        )}
        <button
          type="submit"
          disabled={!isDirty || isPending}
          className="text-xs bg-zinc-700 text-zinc-100 px-2 py-0.5 rounded hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ✓
        </button>
      </form>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={isPending}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
        >
          ✕
        </button>
      ) : (
        <span className="flex items-center gap-1">
          <span className="text-xs text-zinc-500">¿Borrar?</span>
          <button
            type="button"
            onClick={handleDelete}
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
  )
}
