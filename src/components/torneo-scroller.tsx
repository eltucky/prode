'use client'
import { useEffect } from 'react'

export function TorneoScroller({ targetMatchId }: { targetMatchId: string | null }) {
  useEffect(() => {
    if (!targetMatchId) return
    const el = document.getElementById(targetMatchId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [targetMatchId])

  return null
}
