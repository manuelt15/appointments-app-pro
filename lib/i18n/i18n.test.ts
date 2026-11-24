import { describe, expect, it, vi } from 'vitest'
import { es } from './dictionaries/es'
import { en } from './dictionaries/en'
import { getLocale, t } from './index'

const { cookieGet } = vi.hoisted(() => ({ cookieGet: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: cookieGet }) }))

function leafKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return child !== null && typeof child === 'object' ? leafKeys(child, fullKey) : [fullKey]
  }).sort()
}

function assertParity(source: object, target: object) {
  const sourceKeys = leafKeys(source)
  const targetKeys = leafKeys(target)
  for (const key of sourceKeys) expect(targetKeys, `Missing translation: ${key}`).toContain(key)
  for (const key of targetKeys) expect(sourceKeys, `Unexpected translation: ${key}`).toContain(key)
}

describe('i18n', () => {
  it('has recursive key parity with a concrete missing-key diagnostic', () => {
    assertParity(es, en)
    expect(() => assertParity({ nav: { home: 'Inicio' } }, { nav: {} })).toThrow('Missing translation: nav.home')
  })
  it('interpolates names in both languages', () => {
    expect(t('en', 'nav.accountLabel', { name: 'Manuel' })).toBe('Account: Manuel')
    expect(t('es', 'nav.accountLabel', { name: 'Manuel' })).toBe('Cuenta: Manuel')
  })
  it('returns missing keys visibly, including inherited object names', () => {
    expect(t('es', 'missing.key')).toBe('missing.key')
    expect(t('en', 'toString')).toBe('toString')
  })
  it('preserves placeholders without a provided value', () => {
    expect(t('en', 'nav.accountLabel')).toBe('Account: {name}')
  })
  it.each([['en', 'en'], ['es', 'es'], [undefined, 'es'], ['garbage', 'es']])('resolves cookie %s to %s', async (value, expected) => {
    cookieGet.mockReturnValue(value === undefined ? undefined : { value })
    expect(await getLocale()).toBe(expected)
    expect(cookieGet).toHaveBeenCalledWith('locale')
  })
})
