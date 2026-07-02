import { PageLoader } from '@/components/page-loader'
import { Skeleton } from '@/components/skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <PageLoader />
      <Skeleton className="h-7 w-20" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  )
}
