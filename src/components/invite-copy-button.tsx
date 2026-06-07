'use client'

import { useState, useEffect } from 'react'

export function InviteCopyButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(`${window.location.origin}/invite/${inviteCode}`)
  }, [inviteCode])

  async function handleCopy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Invitar amigos</p>
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-mono truncate flex-1 min-w-0"
          style={{ color: 'var(--text-primary)' }}
        >
          {url || `…/invite/${inviteCode}`}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 rounded-lg shrink-0 font-medium cursor-pointer transition-colors"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}
