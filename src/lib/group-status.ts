import { MatchStage } from '@prisma/client'

export type GroupStatus = 'complete' | 'actionRequired' | 'missed'

export const LOCK_THRESHOLD_MS = 60 * 1000

export function computeGroupStatusMap(
  matches: Array<{ id: string; stage: MatchStage; groupName: string | null; scheduledAt: Date }>,
  predMatchIds: Set<string>,
  now = Date.now()
): Map<string, GroupStatus> {
  const byGroup = new Map<string, typeof matches>()

  for (const match of matches) {
    if (match.stage !== 'GROUP' || !match.groupName) continue
    const list = byGroup.get(match.groupName) ?? []
    list.push(match)
    byGroup.set(match.groupName, list)
  }

  const result = new Map<string, GroupStatus>()

  for (const [groupName, groupMatches] of byGroup) {
    let hasActionRequired = false
    let hasMissedLocked = false

    for (const match of groupMatches) {
      if (predMatchIds.has(match.id)) continue
      const locked = now >= match.scheduledAt.getTime() - LOCK_THRESHOLD_MS
      if (locked) hasMissedLocked = true
      else hasActionRequired = true
    }

    if (!hasActionRequired && !hasMissedLocked) result.set(groupName, 'complete')
    else if (hasActionRequired) result.set(groupName, 'actionRequired')
    else result.set(groupName, 'missed')
  }

  return result
}
