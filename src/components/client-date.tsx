'use client'

import { useEffect, useState } from 'react'

export function ClientDate({ iso }: { iso: string }) {
  const [text, setText] = useState('')

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setText(
      new Date(iso).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone,
      })
    )
  }, [iso])

  return <span>{text}</span>
}
