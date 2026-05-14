import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({ prisma: {} }))

describe('configuración de Auth.js', () => {
  it('exporta handlers GET y POST', async () => {
    const mod = await import('@/auth')
    expect(typeof mod.handlers.GET).toBe('function')
    expect(typeof mod.handlers.POST).toBe('function')
  })

  it('exporta auth, signIn y signOut', async () => {
    const mod = await import('@/auth')
    expect(mod.auth).toBeDefined()
    expect(mod.signIn).toBeDefined()
    expect(mod.signOut).toBeDefined()
  })
})
