import { describe, it, expect } from 'vitest'
import { calculatePoints } from '@/lib/scoring'
import { MatchStage } from '@prisma/client'

const baseMatch = {
  homeScore: 2,
  awayScore: 1,
  winnerId: 'home-id',
  stage: 'GROUP' as MatchStage,
}

describe('calculatePoints — fase de grupos', () => {
  it('retorna null si el partido no tiene resultado', () => {
    expect(calculatePoints(
      { homeScore: 2, awayScore: 1, predictedWinnerId: null },
      { ...baseMatch, homeScore: null, awayScore: null, winnerId: null }
    )).toBeNull()
  })

  it('retorna 0 si el resultado es incorrecto (ganador equivocado)', () => {
    expect(calculatePoints(
      { homeScore: 2, awayScore: 0, predictedWinnerId: null },
      { ...baseMatch, homeScore: 1, awayScore: 2, winnerId: 'away-id' }
    )).toBe(0)
  })

  it('retorna 0 si predijo empate pero ganó alguien', () => {
    expect(calculatePoints(
      { homeScore: 1, awayScore: 1, predictedWinnerId: null },
      { ...baseMatch, homeScore: 2, awayScore: 1, winnerId: 'home-id' }
    )).toBe(0)
  })

  it('retorna 2 si el resultado es correcto pero no exacto', () => {
    expect(calculatePoints(
      { homeScore: 1, awayScore: 0, predictedWinnerId: null },
      { ...baseMatch, homeScore: 2, awayScore: 1, winnerId: 'home-id' }
    )).toBe(2)
  })

  it('retorna 3 si el resultado es correcto y un marcador coincide', () => {
    expect(calculatePoints(
      { homeScore: 2, awayScore: 0, predictedWinnerId: null },
      { ...baseMatch, homeScore: 2, awayScore: 1, winnerId: 'home-id' }
    )).toBe(3)
  })

  it('retorna 3 si el resultado es correcto y solo el marcador visitante coincide', () => {
    expect(calculatePoints(
      { homeScore: 3, awayScore: 1, predictedWinnerId: null },
      { ...baseMatch, homeScore: 2, awayScore: 1, winnerId: 'home-id' }
    )).toBe(3)
  })

  it('retorna 5 si el resultado es exacto', () => {
    expect(calculatePoints(
      { homeScore: 2, awayScore: 1, predictedWinnerId: null },
      { ...baseMatch, homeScore: 2, awayScore: 1, winnerId: 'home-id' }
    )).toBe(5)
  })

  it('retorna 5 si el empate es exacto', () => {
    expect(calculatePoints(
      { homeScore: 1, awayScore: 1, predictedWinnerId: null },
      { ...baseMatch, homeScore: 1, awayScore: 1, winnerId: null }
    )).toBe(5)
  })
})

describe('calculatePoints — rondas eliminatorias', () => {
  const knockoutMatch = {
    ...baseMatch,
    stage: 'ROUND_OF_16' as MatchStage,
    homeScore: 1,
    awayScore: 1,
    winnerId: 'home-id',
  }

  it('agrega +2 si acertó el ganador final (total: 7 pts con resultado exacto)', () => {
    expect(calculatePoints(
      { homeScore: 1, awayScore: 1, predictedWinnerId: 'home-id' },
      knockoutMatch
    )).toBe(7)
  })

  it('no agrega +2 si no acertó el ganador final', () => {
    expect(calculatePoints(
      { homeScore: 1, awayScore: 1, predictedWinnerId: 'away-id' },
      knockoutMatch
    )).toBe(5)
  })

  it('no agrega +2 si predictedWinnerId es null en eliminatoria', () => {
    expect(calculatePoints(
      { homeScore: 1, awayScore: 1, predictedWinnerId: null },
      knockoutMatch
    )).toBe(5)
  })
})
