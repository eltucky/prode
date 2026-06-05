import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/import-tournament', () => ({ importTournament: vi.fn() }))

import { auth } from '@/auth'
import { importTournament } from '@/lib/import-tournament'
import { importTournamentAction } from '@/app/(protected)/admin/importar/actions'

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  return fd
}

describe('importTournamentAction', () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({ user: { isSuperAdmin: true } } as never)
    vi.mocked(importTournament).mockResolvedValue({ tournamentId: 'tid', teamsUpserted: 10, matchesUpserted: 48 })
  })

  it('devuelve error si el usuario no es superadmin', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isSuperAdmin: false } } as never)
    const result = await importTournamentAction(null, makeFormData({ leagueId: '1', season: '2026', name: 'Test' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/denegado/i)
  })

  it('devuelve error si falta leagueId', async () => {
    const result = await importTournamentAction(null, makeFormData({ season: '2026', name: 'Test' }))
    expect(result.ok).toBe(false)
  })

  it('devuelve error si falta season', async () => {
    const result = await importTournamentAction(null, makeFormData({ leagueId: '1', name: 'Test' }))
    expect(result.ok).toBe(false)
  })

  it('devuelve error si falta name', async () => {
    const result = await importTournamentAction(null, makeFormData({ leagueId: '1', season: '2026' }))
    expect(result.ok).toBe(false)
  })

  it('devuelve ok:true con resultado cuando los datos son válidos', async () => {
    const result = await importTournamentAction(null, makeFormData({ leagueId: '1', season: '2026', name: 'FIFA World Cup 2026' }))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.result.teamsUpserted).toBe(10)
      expect(result.result.matchesUpserted).toBe(48)
    }
  })

  it('devuelve ok:false con mensaje de error cuando importTournament falla', async () => {
    vi.mocked(importTournament).mockRejectedValue(new Error('API timeout'))
    const result = await importTournamentAction(null, makeFormData({ leagueId: '1', season: '2026', name: 'Test' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('API timeout')
  })
})
