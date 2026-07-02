'use client'

import { useState } from 'react'

const CREATURES = ['🐲', '👾', '🦇', '🐸']

type Direction = 'alternate' | 'alternate-reverse'

export function PageLoader() {
  // Se calcula una sola vez por instancia (al montar), no en cada render.
  const [directions] = useState<Direction[]>(() =>
    CREATURES.map(() => (Math.random() < 0.5 ? 'alternate' : 'alternate-reverse'))
  )

  return (
    <div className="page-loader" aria-hidden="true">
      <span className="page-loader-ball">⚽</span>
      {CREATURES.map((creature, i) => {
        const duration = 3.2 + i * 0.6
        // Delay negativo: la animación arranca ya "en curso", cerca del
        // centro de su recorrido, en vez de esperar pegada al borde izquierdo.
        const delay = -(duration / 2 + i * 0.3)
        return (
          <div
            key={creature}
            className="page-loader-mon-track"
            style={{
              top: `${12 + i * 24}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              animationDirection: directions[i],
            }}
          >
            <span
              className="page-loader-mon-spin"
              style={{ animationDuration: `${0.8 + i * 0.15}s` }}
            >
              {creature}
            </span>
          </div>
        )
      })}
    </div>
  )
}
