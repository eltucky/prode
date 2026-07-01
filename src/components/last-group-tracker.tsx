'use client'

import { useEffect } from 'react'

export const LAST_GROUP_KEY = 'prode:lastGroupId'

export function LastGroupTracker({ groupId }: { groupId: string }) {
  useEffect(() => {
    localStorage.setItem(LAST_GROUP_KEY, groupId)
  }, [groupId])

  return null
}
