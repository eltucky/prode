'use client'

import { useSyncExternalStore } from 'react'
import { LAST_GROUP_KEY } from '@/components/last-group-tracker'

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}

function getSnapshot() {
  const lastGroupId = localStorage.getItem(LAST_GROUP_KEY)
  return lastGroupId ? `/grupos/${lastGroupId}` : '/grupos'
}

function getServerSnapshot() {
  return '/grupos'
}

export function useLastGroupHref(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
