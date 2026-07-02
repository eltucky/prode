const CREATURES = ['🐲', '👾', '🦇', '🐸']

export function PageLoader() {
  return (
    <div className="page-loader" aria-hidden="true">
      <span className="page-loader-ball">⚽</span>
      {CREATURES.map((creature, i) => (
        <div
          key={creature}
          className="page-loader-mon-track"
          style={{
            top: `${12 + i * 24}%`,
            animationDuration: `${3.2 + i * 0.6}s`,
            animationDelay: `${i * 0.4}s`,
          }}
        >
          <span
            className="page-loader-mon-spin"
            style={{ animationDuration: `${0.8 + i * 0.15}s` }}
          >
            {creature}
          </span>
        </div>
      ))}
    </div>
  )
}
