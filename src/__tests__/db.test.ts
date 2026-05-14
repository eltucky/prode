// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/db'
import { PrismaClient } from '@prisma/client'

describe('prisma client singleton', () => {
  it('exporta una instancia de PrismaClient', () => {
    expect(prisma.constructor).toBe(PrismaClient)
  })

  it('guarda la instancia en globalThis para reutilizarla entre hot reloads', () => {
    const g = globalThis as { prisma?: unknown }
    expect(g.prisma).toBe(prisma)
  })
})
