// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/db'
import { PrismaClient } from '@prisma/client'

describe('prisma client singleton', () => {
  it('exporta una instancia de PrismaClient', () => {
    expect(prisma.constructor).toBe(PrismaClient)
  })

  it('en desarrollo, guarda la instancia en globalThis para evitar múltiples conexiones', () => {
    const g = globalThis as { prisma?: PrismaClient }
    if (process.env.NODE_ENV !== 'production') {
      expect(g.prisma).toBe(prisma)
    }
  })
})
