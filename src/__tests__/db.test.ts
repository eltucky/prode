import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock PrismaClient before any module under test loads it
vi.mock('@/generated/prisma/client', () => {
  class MockPrismaClient {}
  return { PrismaClient: MockPrismaClient }
})

// Reset the singleton between tests
beforeEach(() => {
  const g = globalThis as { prisma?: unknown }
  delete g.prisma
  vi.resetModules()
})

describe('prisma client singleton', () => {
  it('exporta una instancia de PrismaClient', async () => {
    const { prisma } = await import('@/lib/db')
    const { PrismaClient } = await import('@/generated/prisma/client')
    expect(prisma).toBeInstanceOf(PrismaClient)
  })

  it('en desarrollo, guarda la instancia en globalThis para evitar múltiples conexiones', async () => {
    const { prisma } = await import('@/lib/db')
    const g = globalThis as { prisma?: unknown }
    if (process.env.NODE_ENV !== 'production') {
      expect(g.prisma).toBe(prisma)
    }
  })
})
