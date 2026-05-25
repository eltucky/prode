'use client'

export function ClientDate({ iso }: { iso: string }) {
  const date = new Date(iso)
  return (
    <span suppressHydrationWarning>
      {date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })}
    </span>
  )
}
