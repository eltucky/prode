import { PageLoader } from '@/components/page-loader'
import { Skeleton } from '@/components/skeleton'

export default function AdminPartidosLoading() {
  return (
    <div className="space-y-6">
      <PageLoader />
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800/50 border-b border-zinc-800">
            <tr>
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-3 w-14" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-2"><Skeleton className="h-4 w-6" /></td>
                <td className="px-4 py-2">
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-4 w-36" />
                </td>
                <td className="px-4 py-2"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-2"><Skeleton className="h-4 w-12" /></td>
                <td className="px-4 py-2"><Skeleton className="h-5 w-16 rounded-full" /></td>
                <td className="px-4 py-2"><Skeleton className="h-7 w-20 rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
