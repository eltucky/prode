'use server'

import { auth } from '@/auth'
import { importTournament, type ImportResult } from '@/lib/import-tournament'

type ActionState = { ok: true; result: ImportResult } | { ok: false; error: string }

export async function importTournamentAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) return { ok: false, error: 'Acceso denegado' }

  const leagueId = Number(formData.get('leagueId'))
  const season = Number(formData.get('season'))
  const name = String(formData.get('name') ?? '').trim()

  if (!leagueId || !season || !name) {
    return { ok: false, error: 'Todos los campos son requeridos' }
  }

  try {
    const result = await importTournament({ leagueId, season, name })
    return { ok: true, result }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}
