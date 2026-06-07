'use client'

import { useRouter } from 'next/navigation'
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

  const pillClass = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer ${active ? 'font-bold' : ''}`

  return (
    <>
      {showStageFilter && (
        <div className="flex items-center gap-2 flex-wrap">
          <Pill
            active={!stageFilter}
            onClick={() => router.push('/torneo')}
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
                onClick={() => router.push(href)}
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
                onClick={() => router.push(href)}
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
                onClick={() => router.push(href)}
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
  onClick,
  pillClass,
  children,
}: {
  active: boolean
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
    </button>
  )
}
