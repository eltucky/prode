import { describe, it, expect } from 'vitest'
import { t, getDictionary, LOCALES, DEFAULT_LOCALE } from '@/lib/i18n'

describe('t() interpolation', () => {
  it('returns string unchanged when no vars', () => {
    expect(t('Hello world')).toBe('Hello world')
  })

  it('interpolates a single variable', () => {
    expect(t('Bienvenido, {name}', { name: 'Ana' })).toBe('Bienvenido, Ana')
  })

  it('interpolates a numeric variable', () => {
    expect(t('{count} participantes', { count: 5 })).toBe('5 participantes')
  })

  it('interpolates multiple variables', () => {
    expect(t('{a} y {b}', { a: 'uno', b: 'dos' })).toBe('uno y dos')
  })

  it('leaves unknown keys in place', () => {
    expect(t('Hello, {name}', {})).toBe('Hello, {name}')
  })
})

describe('getDictionary()', () => {
  it('returns a dictionary for "es" with expected top-level keys', async () => {
    const dict = await getDictionary('es')
    expect(dict).toHaveProperty('nav')
    expect(dict).toHaveProperty('login')
    expect(dict).toHaveProperty('grupos')
    expect(dict.nav.torneo).toBe('Torneo')
  })

  it('returns a dictionary for "en" with expected top-level keys', async () => {
    const dict = await getDictionary('en')
    expect(dict).toHaveProperty('nav')
    expect(dict).toHaveProperty('login')
    expect(dict.nav.torneo).toBe('Tournament')
  })
})

describe('constants', () => {
  it('LOCALES contains es and en', () => {
    expect(LOCALES).toContain('es')
    expect(LOCALES).toContain('en')
  })

  it('DEFAULT_LOCALE is es', () => {
    expect(DEFAULT_LOCALE).toBe('es')
  })
})
