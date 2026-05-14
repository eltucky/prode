import { describe, it, expect } from 'vitest'
import { determineWinnerId, mapApiStatusToMatchStatus } from '@/lib/sync-results'

describe('mapApiStatusToMatchStatus', () => {
  it('mapea FT a FINISHED', () => {
    expect(mapApiStatusToMatchStatus('FT')).toBe('FINISHED')
  })

  it('mapea AET a FINISHED', () => {
    expect(mapApiStatusToMatchStatus('AET')).toBe('FINISHED')
  })

  it('mapea PEN a FINISHED', () => {
    expect(mapApiStatusToMatchStatus('PEN')).toBe('FINISHED')
  })

  it('mapea PST a POSTPONED', () => {
    expect(mapApiStatusToMatchStatus('PST')).toBe('POSTPONED')
  })

  it('mapea 1H y 2H a IN_PROGRESS', () => {
    expect(mapApiStatusToMatchStatus('1H')).toBe('IN_PROGRESS')
    expect(mapApiStatusToMatchStatus('2H')).toBe('IN_PROGRESS')
  })

  it('mapea NS a SCHEDULED', () => {
    expect(mapApiStatusToMatchStatus('NS')).toBe('SCHEDULED')
  })
})

describe('determineWinnerId', () => {
  it('retorna homeTeamId cuando home score es mayor', () => {
    expect(determineWinnerId(2, 1, 'home-id', 'away-id')).toBe('home-id')
  })

  it('retorna awayTeamId cuando away score es mayor', () => {
    expect(determineWinnerId(1, 2, 'home-id', 'away-id')).toBe('away-id')
  })

  it('retorna null cuando es empate (solo para fase de grupos)', () => {
    expect(determineWinnerId(1, 1, 'home-id', 'away-id')).toBeNull()
  })

  it('retorna null si algún score es null', () => {
    expect(determineWinnerId(null, null, 'home-id', 'away-id')).toBeNull()
  })
})
