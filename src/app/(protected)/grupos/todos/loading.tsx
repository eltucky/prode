import { Skeleton } from '@/components/skeleton'

export default function GruposTodosLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-24 mt-1" />
        <Skeleton className="h-3 w-36" />
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <Skeleton className="h-4 w-48" />
        </div>
        <div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-2" style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <Skeleton className="h-4 w-4" />
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8 hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
