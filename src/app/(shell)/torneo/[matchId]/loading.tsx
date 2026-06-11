import { Skeleton } from '@/components/skeleton'

export default function MatchDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-28" />
      <div
        className="rounded-xl px-4 py-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex-1 flex flex-col items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}
