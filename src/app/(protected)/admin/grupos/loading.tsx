import { PageLoader } from '@/components/page-loader'
import { Skeleton } from '@/components/skeleton'

export default function AdminGruposLoading() {
  return (
    <div className="space-y-4">
      <PageLoader />
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-4 w-40" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
          </div>
          <div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="flex items-center justify-between px-4 py-2"
                style={{ borderTop: j > 0 ? '1px solid #27272a' : 'none' }}
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-5 w-14 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
