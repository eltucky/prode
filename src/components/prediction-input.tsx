// src/components/prediction-input.tsx
'use client'

import { useTransition, useState, useRef, useEffect } from 'react'
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
  scheduledAt: string
}

type SaveStatus = 'idle' | 'partial' | 'saving' | 'saved' | 'locked'

export function PredictionInput({
  matchId,
  prediction,
  homeTeam,
  awayTeam,
  homeTeamId,
  awayTeamId,
  isKnockout,
  scheduledAt,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [homeScore, setHomeScore] = useState<number | null>(prediction?.homeScore ?? null)
  const [awayScore, setAwayScore] = useState<number | null>(prediction?.awayScore ?? null)
  const [winnerId, setWinnerId] = useState(prediction?.predictedWinnerId ?? '')
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [confirming, setConfirming] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const wasPending = useRef(false)
  const skipSaved = useRef(false)

  // Auto-lock when the match lock time arrives on the client
  useEffect(() => {
    const lockAt = new Date(scheduledAt).getTime() - 60 * 1000
    const delay = lockAt - Date.now()
    if (delay <= 0) { setStatus('locked'); return }
    const t = setTimeout(() => setStatus('locked'), delay)
    return () => clearTimeout(t)
  }, [scheduledAt])

  useEffect(() => {
    if (wasPending.current && !isPending) {
      if (!skipSaved.current) {
        setStatus('saved')
        const t = setTimeout(() => setStatus('idle'), 2000)
        return () => clearTimeout(t)
      }
      skipSaved.current = false
    }
    wasPending.current = isPending
  }, [isPending])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (status === 'locked') return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (homeScore === null || awayScore === null) {
      setStatus(homeScore === null && awayScore === null ? 'idle' : 'partial')
      return
    }

    setStatus('saving')
    debounceRef.current = setTimeout(() => {
      const fd = new FormData()
      fd.set('matchId', matchId)
      fd.set('homeScore', String(homeScore))
      fd.set('awayScore', String(awayScore))
      if (winnerId) fd.set('predictedWinnerId', winnerId)
      startTransition(async () => {
        const result = await savePrediction(fd)
        if (result?.error === 'locked') {
          skipSaved.current = true
          setStatus('locked')
        }
      })
    }, 500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [homeScore, awayScore, winnerId, matchId, status])

  function changeScore(score: number | null, setter: (v: number | null) => void, delta: 1 | -1) {
    if (delta === 1) {
      setter(score === null ? 0 : Math.min(score + 1, 99))
    } else {
      if (score === null || score === 0) return
      setter(score - 1)
    }
  }

  function handleInputChange(value: string, setter: (v: number | null) => void) {
    if (value === '') { setter(null); return }
    const n = parseInt(value, 10)
    if (!isNaN(n) && n >= 0 && n <= 99) setter(n)
  }

  function handleDelete() {
    setConfirming(false)
    setHomeScore(null)
    setAwayScore(null)
    setWinnerId('')
    setStatus('idle')
    startTransition(() => { deletePrediction(matchId) })
  }

  const hasPrediction = prediction !== null
  const showKnockoutSelector =
    isKnockout &&
    homeTeam &&
    awayTeam &&
    homeScore !== null &&
    awayScore !== null &&
    homeScore === awayScore

  const isLocked = status === 'locked'

  const statusText: string | null = {
    idle: hasPrediction ? null : 'Tocá ▲ para empezar',
    partial: 'Completá el otro score',
    saving: 'Guardando...',
    saved: '✓ Guardado',
    locked: 'Este partido ya cerró',
  }[status]

  return (
    <div className="space-y-3">
      <div className="relative">
        {hasPrediction && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Borrar pronóstico"
            className="absolute top-0 right-0 text-sm leading-none transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            🗑
          </button>
        )}

        {/* Mobile */}
        <div className="flex w-full items-center justify-between md:hidden">
          <div className="flex flex-col items-center gap-1">
            <ArrowBtn label="Aumentar" onClick={() => changeScore(homeScore, setHomeScore, 1)} disabled={isLocked} />
            <span className="text-3xl leading-none">{homeTeam?.flag ?? '?'}</span>
            <ArrowBtn label="Disminuir" down onClick={() => changeScore(homeScore, setHomeScore, -1)} disabled={isLocked || homeScore === null || homeScore === 0} />
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-3xl font-extrabold tabular-nums w-8 text-center"
              style={{ color: homeScore === null ? 'var(--text-dimmed)' : 'var(--text-primary)' }}
            >
              {homeScore ?? '—'}
            </span>
            <span className="text-xl font-light" style={{ color: 'var(--text-dimmed)' }}>—</span>
            <span
              className="text-3xl font-extrabold tabular-nums w-8 text-center"
              style={{ color: awayScore === null ? 'var(--text-dimmed)' : 'var(--text-primary)' }}
            >
              {awayScore ?? '—'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ArrowBtn label="Aumentar" onClick={() => changeScore(awayScore, setAwayScore, 1)} disabled={isLocked} />
            <span className="text-3xl leading-none">{awayTeam?.flag ?? '?'}</span>
            <ArrowBtn label="Disminuir" down onClick={() => changeScore(awayScore, setAwayScore, -1)} disabled={isLocked || awayScore === null || awayScore === 0} />
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex w-full items-center">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-3xl leading-none">{homeTeam?.flag ?? '?'}</span>
            <span className="text-xs w-full text-center truncate px-2" style={{ color: 'var(--text-muted)' }}>
              {homeTeam?.name}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ScoreInputWithArrows
              value={homeScore}
              onIncrement={() => changeScore(homeScore, setHomeScore, 1)}
              onDecrement={() => changeScore(homeScore, setHomeScore, -1)}
              onChange={v => handleInputChange(v, setHomeScore)}
              disabled={isLocked}
            />
            <span className="text-xl font-light" style={{ color: 'var(--text-dimmed)' }}>—</span>
            <ScoreInputWithArrows
              value={awayScore}
              onIncrement={() => changeScore(awayScore, setAwayScore, 1)}
              onDecrement={() => changeScore(awayScore, setAwayScore, -1)}
              onChange={v => handleInputChange(v, setAwayScore)}
              disabled={isLocked}
            />
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-3xl leading-none">{awayTeam?.flag ?? '?'}</span>
            <span className="text-xs w-full text-center truncate px-2" style={{ color: 'var(--text-muted)' }}>
              {awayTeam?.name}
            </span>
          </div>
        </div>
      </div>

      {showKnockoutSelector && (
        <select
          value={winnerId}
          onChange={e => setWinnerId(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Ganador en penales...</option>
          <option value={homeTeamId!}>{homeTeam!.flag} {homeTeam!.name}</option>
          <option value={awayTeamId!}>{awayTeam!.flag} {awayTeam!.name}</option>
        </select>
      )}

      {confirming ? (
        <div className="flex items-center justify-center gap-3 text-xs">
          <span style={{ color: 'var(--text-muted)' }}>¿Borrar pronóstico?</span>
          <button
            onClick={handleDelete}
            className="font-semibold"
            style={{ color: '#ef4444' }}
          >
            Sí
          </button>
          <button
            onClick={() => setConfirming(false)}
            style={{ color: 'var(--text-muted)' }}
          >
            No
          </button>
        </div>
      ) : statusText ? (
        <p
          className="text-center text-xs"
          style={{
            color: status === 'saved' ? 'var(--accent)'
                 : status === 'locked' ? '#f59e0b'
                 : 'var(--text-muted)',
          }}
        >
          {statusText}
        </p>
      ) : null}
    </div>
  )
}

function ArrowBtn({
  onClick,
  down = false,
  disabled = false,
  label,
}: {
  onClick: () => void
  down?: boolean
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-7 h-5 flex items-center justify-center rounded text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      {down ? '▼' : '▲'}
    </button>
  )
}

function ScoreInputWithArrows({
  value,
  onIncrement,
  onDecrement,
  onChange,
  disabled = false,
}: {
  value: number | null
  onIncrement: () => void
  onDecrement: () => void
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <ArrowBtn label="Aumentar" onClick={onIncrement} disabled={disabled} />
      <input
        type="number"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        min={0}
        max={99}
        placeholder="—"
        disabled={disabled}
        className="score-input w-14 h-12 text-center text-3xl font-extrabold tabular-nums rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
      />
      <ArrowBtn label="Disminuir" down onClick={onDecrement} disabled={disabled || value === null || value === 0} />
    </div>
  )
}
