import { describe, it, expect } from 'vitest'
import { computeGroupStatusMap } from '@/lib/group-status'

const future = (ms: number) => new Date(Date.now() + ms)
const past   = (ms: number) => new Date(Date.now() - ms)
const HOUR   = 60 * 60 * 1000

describe('computeGroupStatusMap', () => {
  it('returns complete when all group matches have predictions', () => {
    const matches = [
      { id: 'm1', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) },
      { id: 'm2', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) },
    ]
    const map = computeGroupStatusMap(matches, new Set(['m1', 'm2']))
    expect(map.get('A')).toBe('complete')
  })

  it('returns actionRequired when an unlocked match has no prediction', () => {
    const matches = [
      { id: 'm1', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) },
      { id: 'm2', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) },
    ]
    const map = computeGroupStatusMap(matches, new Set(['m1']))
    expect(map.get('A')).toBe('actionRequired')
  })

  it('returns missed when all unpredicted matches are locked', () => {
    const matches = [
      { id: 'm1', stage: 'GROUP' as const, groupName: 'A', scheduledAt: past(HOUR) },
      { id: 'm2', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) },
    ]
    // m1 is locked + unpredicted, m2 is predicted → missed
    const map = computeGroupStatusMap(matches, new Set(['m2']))
    expect(map.get('A')).toBe('missed')
  })

  it('actionRequired wins over missed when group has both', () => {
    const matches = [
      { id: 'm1', stage: 'GROUP' as const, groupName: 'A', scheduledAt: past(HOUR) },  // locked, no pred
      { id: 'm2', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) }, // unlocked, no pred
    ]
    const map = computeGroupStatusMap(matches, new Set())
    expect(map.get('A')).toBe('actionRequired')
  })

  it('handles multiple groups independently', () => {
    const matches = [
      { id: 'm1', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) },
      { id: 'm2', stage: 'GROUP' as const, groupName: 'B', scheduledAt: future(HOUR) },
    ]
    const map = computeGroupStatusMap(matches, new Set(['m1']))
    expect(map.get('A')).toBe('complete')
    expect(map.get('B')).toBe('actionRequired')
  })

  it('ignores non-GROUP stage matches', () => {
    const matches = [
      { id: 'm1', stage: 'ROUND_OF_16' as const, groupName: null, scheduledAt: future(HOUR) },
    ]
    const map = computeGroupStatusMap(matches, new Set())
    expect(map.size).toBe(0)
  })

  it('ignores GROUP matches with null groupName', () => {
    const matches = [
      { id: 'm1', stage: 'GROUP' as const, groupName: null, scheduledAt: future(HOUR) },
    ]
    const map = computeGroupStatusMap(matches, new Set())
    expect(map.size).toBe(0)
  })

  it('returns empty map for empty input', () => {
    const map = computeGroupStatusMap([], new Set())
    expect(map.size).toBe(0)
  })
})
