'use client'

import { useState, useEffect, useRef } from 'react'
import { useDict } from '@/components/locale-provider'

export function InviteCopyButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dict = useDict()

  useEffect(() => {
    setUrl(`${window.location.origin}/invite/${inviteCode}`)
  }, [inviteCode])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  async function handleCopy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy invite URL:', err)
    }
  }

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
        {dict.grupoDetail.inviteTitle}
      </p>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="text-sm font-mono truncate flex-1 min-w-0"
          style={{ color: 'var(--text-primary)' }}
        >
          {url || `…/invite/${inviteCode}`}
        </span>
        <button
          onClick={handleCopy}
          disabled={copied}
          className="text-xs px-3 py-1.5 rounded-lg shrink-0 font-medium cursor-pointer transition-colors"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          {copied ? dict.grupoDetail.copied : dict.grupoDetail.copyButton}
        </button>
      </div>
    </div>
  )
}
