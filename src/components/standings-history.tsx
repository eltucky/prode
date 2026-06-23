'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'

const ROW_H = 54

export type HistoryEntry = {
  userId: string
  name: string
  image: string | null
  points: number
  rank: number
}

export type Snapshot = {
  key: string      // matchId or ISO date
  label: string    // pre-formatted display label
  standings: HistoryEntry[]
}

export type StandingsHistoryLabels = {
  title: string
  play: string
  pause: string
  resume: string
  prev: string
  next: string
  byMatch: string
  byDay: string
}

type Props = {
  matchHistory: Snapshot[]
  dayHistory: Snapshot[]
  currentUserId: string | undefined
  labels: StandingsHistoryLabels
}

export function StandingsHistory({ matchHistory, dayHistory, currentUserId, labels }: Props) {
  const [mode, setMode] = useState<'match' | 'day'>('match')
  const history = mode === 'match' ? matchHistory : dayHistory

  const lastIdx = history.length > 0 ? history.length - 1 : 0
  const [idx, setIdx] = useState(lastIdx)
  const [playing, setPlaying] = useState(false)

  const advance = useCallback(() => {
    setIdx(prev => {
      if (prev >= history.length - 1) {
        setPlaying(false)
        return prev
      }
      return prev + 1
    })
  }, [history.length])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(advance, 1400)
    return () => clearInterval(id)
  }, [playing, advance])

  const switchMode = (newMode: 'match' | 'day') => {
    const h = newMode === 'match' ? matchHistory : dayHistory
    setPlaying(false)
    setMode(newMode)
    setIdx(h.length > 0 ? h.length - 1 : 0)
  }

  const maxLen = Math.max(matchHistory.length, dayHistory.length)
  if (maxLen < 2) return null

  const frame = history[Math.min(idx, history.length - 1)]
  if (!frame) return null

  const prevFrame = idx > 0 ? history[idx - 1] : null

  // Fixed iteration order so DOM elements are stable and CSS transitions fire
  const allUserIds = (history.length > 0 ? history[0] : frame).standings.map(s => s.userId)

  const handlePlay = () => {
    if (idx >= history.length - 1) setIdx(0)
    setPlaying(true)
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Header: toggle + current label */}
      <div
        className="px-4 py-3 border-b flex items-center gap-3 flex-wrap"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="flex rounded-lg overflow-hidden text-xs font-medium"
          style={{ border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => switchMode('match')}
            className="px-2.5 py-1"
            style={{
              background: mode === 'match' ? 'var(--accent)' : 'transparent',
              color: mode === 'match' ? '#fff' : 'var(--text-muted)',
            }}
          >
            {labels.byMatch}
          </button>
          <button
            onClick={() => switchMode('day')}
            className="px-2.5 py-1"
            style={{
              background: mode === 'day' ? 'var(--accent)' : 'transparent',
              color: mode === 'day' ? '#fff' : 'var(--text-muted)',
              borderLeft: '1px solid var(--border)',
            }}
          >
            {labels.byDay}
          </button>
        </div>
        <span
          className="text-sm font-semibold ml-auto"
          style={{ color: 'var(--accent)' }}
        >
          {frame.label}
        </span>
      </div>

      {/* Animated standings rows */}
      <div
        className="relative mx-4 my-2"
        style={{ height: allUserIds.length * ROW_H }}
      >
        {allUserIds.map(userId => {
          const entry = frame.standings.find(s => s.userId === userId)!
          const isMe = userId === currentUserId
          const prevPoints = prevFrame?.standings.find(s => s.userId === userId)?.points ?? 0
          const delta = entry.points - prevPoints
          return (
            <div
              key={userId}
              className="absolute left-0 right-0 flex items-center gap-2 rounded-lg px-2"
              style={{
                height: ROW_H - 6,
                top: 3,
                transform: `translateY(${(entry.rank - 1) * ROW_H}px)`,
                transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isMe ? '#22c55e0d' : undefined,
              }}
            >
              <span
                className="w-5 text-center text-xs font-bold tabular-nums shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                {entry.rank}
              </span>
              {entry.image ? (
                <Image
                  src={entry.image}
                  alt={entry.name}
                  width={28}
                  height={28}
                  className="rounded-full shrink-0"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-medium"
                  style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
                >
                  {entry.name[0] ?? '?'}
                </div>
              )}
              <span
                className={`flex-1 truncate text-sm ${isMe ? 'font-semibold' : ''}`}
                style={{ color: 'var(--text-primary)' }}
              >
                {entry.name}
              </span>
              {delta > 0 && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums"
                  style={{ background: '#22c55e22', color: '#22c55e' }}
                >
                  +{delta}
                </span>
              )}
              <span
                className="font-bold tabular-nums text-sm shrink-0"
                style={{ color: 'var(--accent)' }}
              >
                {entry.points}
                <span className="font-normal text-xs ml-0.5" style={{ color: 'var(--text-muted)' }}>
                  pts
                </span>
              </span>
            </div>
          )
        })}
      </div>

      {/* Timeline slider */}
      <div className="px-4 pb-1">
        <input
          type="range"
          min={0}
          max={history.length - 1}
          value={idx}
          onChange={e => {
            setPlaying(false)
            setIdx(Number(e.target.value))
          }}
          className="w-full"
          style={{ accentColor: 'var(--accent)' }}
        />
        <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          <span>{history[0]?.label}</span>
          <span>{history[history.length - 1]?.label}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
        {playing ? (
          <button
            onClick={() => setPlaying(false)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            ⏸ {labels.pause}
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            ▶ {idx >= history.length - 1 ? labels.play : labels.resume}
          </button>
        )}
        <button
          onClick={() => { setPlaying(false); setIdx(p => Math.max(0, p - 1)) }}
          disabled={idx === 0}
          className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40"
          style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
        >
          {labels.prev}
        </button>
        <button
          onClick={() => { setPlaying(false); setIdx(p => Math.min(history.length - 1, p + 1)) }}
          disabled={idx >= history.length - 1}
          className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40"
          style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
        >
          {labels.next}
        </button>
      </div>
    </div>
  )
}
