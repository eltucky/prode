import { describe, it, expect } from 'vitest'

function resolveRedirect(
  isLoggedIn: boolean,
  pathname: string
): 'login' | 'grupos' | null {
  const isPublic = pathname === '/' || pathname === '/login' || pathname === '/reglas' || pathname === '/torneo' || pathname.startsWith('/torneo?') || pathname.startsWith('/api/auth') || pathname.startsWith('/invite/')
  if (!isLoggedIn && !isPublic) return 'login'
  if (isLoggedIn && pathname === '/login') return 'grupos'
  return null
}

describe('lógica de redirección del middleware', () => {
  it('redirige usuario no autenticado al login', () => {
    expect(resolveRedirect(false, '/grupos')).toBe('login')
  })

  it('redirige usuario no autenticado en ruta protegida cualquiera', () => {
    expect(resolveRedirect(false, '/grupos/abc')).toBe('login')
  })

  it('permite usuario no autenticado en /login', () => {
    expect(resolveRedirect(false, '/login')).toBeNull()
  })

  it('permite usuario no autenticado en rutas /api/auth', () => {
    expect(resolveRedirect(false, '/api/auth/signin')).toBeNull()
  })

  it('permite usuario no autenticado en /', () => {
    expect(resolveRedirect(false, '/')).toBeNull()
  })

  it('permite usuario no autenticado en /torneo', () => {
    expect(resolveRedirect(false, '/torneo')).toBeNull()
  })

  it('permite usuario no autenticado en /reglas', () => {
    expect(resolveRedirect(false, '/reglas')).toBeNull()
  })

  it('redirige usuario autenticado en /login a grupos', () => {
    expect(resolveRedirect(true, '/login')).toBe('grupos')
  })

  it('permite usuario autenticado en ruta protegida', () => {
    expect(resolveRedirect(true, '/grupos')).toBeNull()
  })

  it('permite usuario no autenticado en /invite/', () => {
    expect(resolveRedirect(false, '/invite/abc123')).toBeNull()
  })
})

// ─── Locale resolver ──────────────────────────────────────────────────────────

function resolveLocale(cookieValue: string | undefined, acceptLanguage: string): string {
  if (cookieValue === 'es' || cookieValue === 'en') return cookieValue
  const firstTag = acceptLanguage.split(',')[0].split(';')[0].trim()
  const code = firstTag.split('-')[0].toLowerCase()
  if (code === 'es' || code === 'en') return code
  return 'es'
}

describe('resolveLocale()', () => {
  it('returns cookie value when valid', () => {
    expect(resolveLocale('en', '')).toBe('en')
    expect(resolveLocale('es', '')).toBe('es')
  })

  it('ignores invalid cookie value and falls back to Accept-Language', () => {
    expect(resolveLocale('fr', 'en-US,en;q=0.9')).toBe('en')
  })

  it('parses Accept-Language with quality values', () => {
    expect(resolveLocale(undefined, 'en-US,en;q=0.9,es;q=0.8')).toBe('en')
  })

  it('parses Accept-Language with region tag', () => {
    expect(resolveLocale(undefined, 'es-AR,es;q=0.9')).toBe('es')
  })

  it('defaults to es when no match', () => {
    expect(resolveLocale(undefined, 'fr-FR,fr;q=0.9')).toBe('es')
  })

  it('defaults to es when Accept-Language is empty', () => {
    expect(resolveLocale(undefined, '')).toBe('es')
  })
})

// ─── Theme resolver ─────────────────────────────────────────────────────────

function resolveTheme(cookieValue: string | undefined): string {
  if (cookieValue === 'dark' || cookieValue === 'light' || cookieValue === 'pokemon') {
    return cookieValue
  }
  return 'dark'
}

describe('resolveTheme()', () => {
  it('returns cookie value when valid', () => {
    expect(resolveTheme('dark')).toBe('dark')
    expect(resolveTheme('light')).toBe('light')
    expect(resolveTheme('pokemon')).toBe('pokemon')
  })

  it('defaults to dark when cookie is missing', () => {
    expect(resolveTheme(undefined)).toBe('dark')
  })

  it('defaults to dark when cookie is invalid', () => {
    expect(resolveTheme('blue')).toBe('dark')
  })
})
