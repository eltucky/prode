import { PageLoader } from '@/components/page-loader'
import { Skeleton } from '@/components/skeleton'

export default function ReglasLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageLoader />
      <div className="space-y-1">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-64" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 4 }).map((_, j) => (
            <div
              key={j}
              className="flex gap-4 items-start rounded-lg p-3"
              style={{ background: 'var(--surface-raised)' }}
            >
              <Skeleton className="w-8 h-8 shrink-0 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
