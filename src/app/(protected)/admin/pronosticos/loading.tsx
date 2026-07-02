import { PageLoader } from '@/components/page-loader'
import { Skeleton } from '@/components/skeleton'

export default function AdminPronosticosLoading() {
  return (
    <div className="space-y-8">
      <PageLoader />
      <Skeleton className="h-7 w-36" />
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <Skeleton className="h-4 w-44" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 max-w-lg rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
