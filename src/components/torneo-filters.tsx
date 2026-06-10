'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { type MatchStage } from '@prisma/client'
import { type GroupStatus } from '@/lib/group-status'
import { Skeleton } from '@/components/skeleton'
import { useDict } from '@/components/locale-provider'

const BADGE_COLORS: Record<GroupStatus, string> = {
  complete:       '#22c55e',
  actionRequired: '#ef4444',
  missed:         '#f59e0b',
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
  children: React.ReactNode
}

export function TorneoFilters({
  showStageFilter,
  filterableStages,
  stageFilter,
  showingGroupStage,
  availableGroups,
  grupoFilter,
  groupStatusMap,
  children,
}: Props) {
  const dict = useDict()

  const BADGE_LABELS: Record<GroupStatus, string> = {
    complete:       dict.torneo.badgeComplete,
    actionRequired: dict.torneo.badgeActionRequired,
    missed:         dict.torneo.badgeMissed,
  }

  const STAGE_LABELS: Record<MatchStage, string> = {
    GROUP:         dict.torneo.stageGroup,
    ROUND_OF_32:   dict.torneo.stageRound32,
    ROUND_OF_16:   dict.torneo.stageRound16,
    QUARTER_FINAL: dict.torneo.stageQuarter,
    SEMI_FINAL:    dict.torneo.stageSemi,
    THIRD_PLACE:   dict.torneo.stageThird,
    FINAL:         dict.torneo.stageFinal,
  }

  const router = useRouter()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)

  // Reset when the URL actually changes (navigation complete)
  const searchParamsStr = searchParams.toString()
  useEffect(() => {
    setIsNavigating(false)
  }, [searchParamsStr])

  function navigate(href: string) {
    setIsNavigating(true)
    router.push(href)
  }

  const pillClass = (active: boolean) =>
    `relative text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer ${active ? 'font-bold' : ''}`

  return (
    <>
      {showStageFilter && (
        <div className="flex items-center gap-2 flex-wrap">
          <Pill
            active={!stageFilter}
            onClick={() => navigate('/torneo')}
            pillClass={pillClass}
          >
            {dict.torneo.filterAll}
          </Pill>
          {filterableStages.map(stage => {
            const href = `/torneo?etapa=${stage}`
            return (
              <Pill
                key={stage}
                active={stageFilter === stage && !grupoFilter}
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
          <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>{dict.torneo.filterGroupLabel}</span>
          {(() => {
            const href = stageFilter === 'GROUP' ? '/torneo?etapa=GROUP' : '/torneo'
            return (
              <Pill
                active={!grupoFilter}
                onClick={() => navigate(href)}
                pillClass={pillClass}
              >
                {dict.torneo.filterAll}
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

      {isNavigating ? <MatchListSkeleton /> : children}
    </>
  )
}

function MatchListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl px-4 py-3 space-y-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center justify-between md:hidden py-1">
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="w-7 h-5" />
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="w-7 h-5" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-10" />
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="w-8 h-10" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="w-7 h-5" />
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="w-7 h-5" />
            </div>
          </div>
          <div className="hidden md:flex items-center">
            <div className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Skeleton className="w-14 h-12 rounded-lg" />
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="w-14 h-12 rounded-lg" />
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
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
