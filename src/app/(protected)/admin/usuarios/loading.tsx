import { Skeleton } from '@/components/skeleton'

export default function AdminUsuariosLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-4 w-44" />
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800/50 border-b border-zinc-800">
            <tr>
              {Array.from({ length: 4 }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Skeleton className="h-4 w-6" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-14 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded" />
                    <Skeleton className="h-6 w-16 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
