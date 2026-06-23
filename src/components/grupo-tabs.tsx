'use client'

import { type ReactNode, useRef, useState } from 'react'
import { StandingsHistory, type Snapshot, type StandingsHistoryLabels } from '@/components/standings-history'

type HistoryData = {
  matchHistory: Snapshot[]
  dayHistory: Snapshot[]
}

type Props = {
  groupId: string
  tabStandingsLabel: string
  tabHistoryLabel: string
  historyLabels: StandingsHistoryLabels
  currentUserId: string | undefined
  children: ReactNode
}

export function GrupoTabs({
  groupId,
  tabStandingsLabel,
  tabHistoryLabel,
  historyLabels,
  currentUserId,
  children,
}: Props) {
  const [tab, setTab] = useState<'standings' | 'history'>('standings')
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef(false)

  const switchToHistory = async () => {
    setTab('history')
    if (fetchedRef.current) return
    fetchedRef.current = true
    setLoading(true)
    try {
      const res = await fetch(`/grupos/${groupId}/history`)
      const data: HistoryData = await res.json()
      setHistoryData(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="flex gap-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setTab('standings')}
          className="px-4 py-2 text-sm font-medium transition-colors"
          style={{
            color: tab === 'standings' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: tab === 'standings' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          {tabStandingsLabel}
        </button>
        <button
          onClick={switchToHistory}
          className="px-4 py-2 text-sm font-medium transition-colors"
          style={{
            color: tab === 'history' ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: tab === 'history' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          {tabHistoryLabel}
        </button>
      </div>

      {tab === 'standings' && children}

      {tab === 'history' && (
        loading || !historyData ? (
          <div
            className="rounded-xl p-8 text-center text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            ···
          </div>
        ) : (
          <StandingsHistory
            matchHistory={historyData.matchHistory}
            dayHistory={historyData.dayHistory}
            currentUserId={currentUserId}
            labels={historyLabels}
          />
        )
      )}
    </div>
  )
}
