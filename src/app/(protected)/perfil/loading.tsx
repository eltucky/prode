import { Skeleton } from '@/components/skeleton'

export default function PerfilLoading() {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Skeleton className="h-6 w-24" />

      {/* User card */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>

      {/* Notifications card */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <Skeleton className="h-4 w-36" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <Skeleton className="w-5 h-5 rounded shrink-0 mt-1" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}
