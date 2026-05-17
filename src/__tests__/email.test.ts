import { describe, it, expect } from 'vitest'
import { buildReminderHtml, buildSummaryHtml } from '@/lib/email'
import type { ReminderMatch, SummaryData } from '@/lib/email'

describe('buildReminderHtml', () => {
  it('incluye los equipos y número de partido', () => {
    const matches: ReminderMatch[] = [
      { matchNumber: 1, homeTeam: 'Argentina', awayTeam: 'Brasil', scheduledAt: new Date('2026-06-15T18:00:00Z') },
    ]
    const html = buildReminderHtml('Mariano', matches)
    expect(html).toContain('Argentina')
    expect(html).toContain('Brasil')
    expect(html).toContain('#1')
    expect(html).toContain('Mariano')
  })

  it('incluye todos los partidos cuando hay varios', () => {
    const matches: ReminderMatch[] = [
      { matchNumber: 1, homeTeam: 'Argentina', awayTeam: 'Brasil', scheduledAt: new Date() },
      { matchNumber: 2, homeTeam: 'Francia', awayTeam: 'Alemania', scheduledAt: new Date() },
    ]
    const html = buildReminderHtml('Mariano', matches)
    expect(html).toContain('Argentina')
    expect(html).toContain('Francia')
    expect(html).toContain('Alemania')
  })
})

describe('buildSummaryHtml', () => {
  it('incluye pronósticos, puntos y posición en grupo', () => {
    const data: SummaryData = {
      predictionsToday: [
        { homeTeam: 'Argentina', awayTeam: 'Brasil', homeScore: 2, awayScore: 1, points: 5 },
      ],
      groups: [{ name: 'Los pibes', position: 1, totalMembers: 5 }],
    }
    const html = buildSummaryHtml('Mariano', data)
    expect(html).toContain('Argentina')
    expect(html).toContain('5 pts')
    expect(html).toContain('Los pibes')
    expect(html).toContain('posición 1 de 5')
    expect(html).toContain('Mariano')
  })

  it('muestra la suma total de puntos del día', () => {
    const data: SummaryData = {
      predictionsToday: [
        { homeTeam: 'A', awayTeam: 'B', homeScore: 1, awayScore: 0, points: 3 },
        { homeTeam: 'C', awayTeam: 'D', homeScore: 0, awayScore: 0, points: 2 },
      ],
      groups: [],
    }
    const html = buildSummaryHtml('Mariano', data)
    expect(html).toContain('5 puntos')
  })
})
