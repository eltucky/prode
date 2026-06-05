'use client'

import { useActionState } from 'react'
import { importTournamentAction } from './actions'
import { SubmitButton } from '@/components/submit-button'

export default function AdminImportarPage() {
  const [state, action] = useActionState(importTournamentAction, null)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Importar torneo</h1>

      <div className="bg-white border rounded-xl p-6 max-w-md">
        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              League ID
            </label>
            <input
              type="number"
              name="leagueId"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ej: 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Season
            </label>
            <input
              type="number"
              name="season"
              required
              defaultValue={2026}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ej: FIFA World Cup 2026"
            />
          </div>

          <SubmitButton className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Importar
          </SubmitButton>
        </form>

        {state && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${state.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {state.ok
              ? `Torneo importado · ${state.result.teamsUpserted} equipos · ${state.result.matchesUpserted} partidos`
              : state.error}
          </div>
        )}
      </div>
    </div>
  )
}
