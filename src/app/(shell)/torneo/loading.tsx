import { PageLoader } from '@/components/page-loader'
import { Skeleton } from '@/components/skeleton'

export default function TorneoLoading() {
  return (
    <div className="space-y-6">
      <PageLoader />
      {/* Group filter pills */}
      <div className="flex gap-2 flex-wrap items-center pb-2">
        <Skeleton className="h-4 w-10" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-10 rounded-full" />
        ))}
      </div>

      {/* Section heading */}
      <Skeleton className="h-4 w-36" />

      {/* Match cards */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function MatchCardSkeleton() {
  return (
    <div
      className="rounded-xl px-4 py-3 space-y-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Header: team names + status badge */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Mobile: arrows + emoji + scores */}
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

      {/* Desktop: emoji + name + score inputs */}
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
  )
}
