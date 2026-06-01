import { describe, it, expect } from 'vitest'
import { MatchStage, MatchStatus } from '@prisma/client'

describe('MatchStage enum', () => {
  it('contiene todas las etapas del torneo', () => {
    const stages = Object.values(MatchStage)
    expect(stages).toContain('GROUP')
    expect(stages).toContain('ROUND_OF_32')
    expect(stages).toContain('ROUND_OF_16')
    expect(stages).toContain('QUARTER_FINAL')
    expect(stages).toContain('SEMI_FINAL')
    expect(stages).toContain('THIRD_PLACE')
    expect(stages).toContain('FINAL')
    expect(stages).toContain('FRIENDLY')
    expect(stages).toHaveLength(8)
  })
})

describe('MatchStatus enum', () => {
  it('contiene todos los estados de un partido', () => {
    const statuses = Object.values(MatchStatus)
    expect(statuses).toContain('SCHEDULED')
    expect(statuses).toContain('IN_PROGRESS')
    expect(statuses).toContain('FINISHED')
    expect(statuses).toContain('POSTPONED')
    expect(statuses).toContain('CANCELLED')
    expect(statuses).toHaveLength(5)
  })
})
