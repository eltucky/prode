'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { type MatchStage } from '@prisma/client'
import { type GroupStatus } from '@/lib/group-status'

const BADGE_COLORS: Record<GroupStatus, string> = {
  complete:       '#22c55e',
  actionRequired: '#ef4444',
  missed:         '#f59e0b',
}

const BADGE_LABELS: Record<GroupStatus, string> = {
  complete:       'Grupo completo',
  actionRequired: 'Pronósticos pendientes',
  missed:         'Pronósticos perdidos',
}

const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP:         'Fase de Grupos',
  ROUND_OF_32:   'Ronda de 32',
  ROUND_OF_16:   'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL:    'Semifinales',
  THIRD_PLACE:   'Tercer Puesto',
  FINAL:         'Final',
}

function groupFilterHref(stageFilter: MatchStage | undefined, target: string): string {
  const params = new URLSearchParams()
  if (stageFilter) params.set('etapa', stageFilter)
  else params.set('etapa', 'GROUP')
  params.set('grupo', target)
  return `/torneo?${params.toString()}`
}

type Props = {
  showStageFilter: boolean
  filterableStages: MatchStage[]
  stageFilter: MatchStage | undefined
  showingGroupStage: boolean
  availableGroups: string[]
  grupoFilter: string | undefined
  groupStatusMap: Record<string, GroupStatus>
}

export function TorneoFilters({
  showStageFilter,
  filterableStages,
  stageFilter,
  showingGroupStage,
  availableGroups,
  grupoFilter,
  groupStatusMap,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  function navigate(href: string) {
    setPendingHref(href)
    startTransition(() => router.push(href))
  }

  const pillClass = (active: boolean) =>
    `relative text-xs px-3 py-1.5 rounded-full font-medium transition-opacity ${active ? 'font-bold' : ''}`

  const pending = (href: string) => isPending && pendingHref === href

  return (
    <>
      {showStageFilter && (
        <div className="flex items-center gap-2 flex-wrap">
          <Pill
            active={!stageFilter}
            loading={pending('/torneo')}
            onClick={() => navigate('/torneo')}
            pillClass={pillClass}
          >
            Todos
          </Pill>
          {filterableStages.map(stage => {
            const href = `/torneo?etapa=${stage}`
            return (
              <Pill
                key={stage}
                active={stageFilter === stage && !grupoFilter}
                loading={pending(href)}
                onClick={() => navigate(href)}
                pillClass={pillClass}
              >
                {STAGE_LABELS[stage]}
              </Pill>
            )
          })}
        </div>
      )}

      {showingGroupStage && availableGroups.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center pb-2">
          <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>Grupo:</span>
          {(() => {
            const href = stageFilter === 'GROUP' ? '/torneo?etapa=GROUP' : '/torneo'
            return (
              <Pill
                active={!grupoFilter}
                loading={pending(href)}
                onClick={() => navigate(href)}
                pillClass={pillClass}
              >
                Todos
              </Pill>
            )
          })()}
          {availableGroups.map(g => {
            const href = groupFilterHref(stageFilter, g)
            const status = groupStatusMap[g]
            const badgeColor = status ? BADGE_COLORS[status] : undefined
            return (
              <Pill
                key={g}
                active={grupoFilter === g}
                loading={pending(href)}
                onClick={() => navigate(href)}
                pillClass={pillClass}
              >
                {g}
                {badgeColor && status && (
                  <span
                    className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2"
                    style={{ background: badgeColor, borderColor: 'var(--bg)' }}
                    aria-label={BADGE_LABELS[status]}
                  />
                )}
              </Pill>
            )
          })}
        </div>
      )}
    </>
  )
}

function Pill({
  active,
  loading,
  onClick,
  pillClass,
  children,
}: {
  active: boolean
  loading: boolean
  onClick: () => void
  pillClass: (active: boolean) => string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={pillClass(active)}
      style={{
        background: active ? 'var(--accent)' : 'var(--surface-raised)',
        color: active ? '#000' : 'var(--text-muted)',
      }}
    >
      {children}
      {loading && (
        <span className="absolute inset-0 rounded-full ring-2 ring-current animate-pulse pointer-events-none" />
      )}
    </button>
  )
}
