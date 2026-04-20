import { describe, it, expect, vi } from 'vitest'
import { buildAliasMap } from './alias-map'

describe('buildAliasMap', () => {
  it('id 自体が alias として登録される', () => {
    const defs = [{ id: 'poset', aliases: [], status: 'published' as const }]
    const map = buildAliasMap(defs)
    expect(map['poset']).toBe('poset')
  })

  it('aliases の各エントリが canonical id にマップされる', () => {
    const defs = [
      { id: 'poset', aliases: ['半順序', '半順序集合'], status: 'published' as const },
    ]
    const map = buildAliasMap(defs)
    expect(map['半順序']).toBe('poset')
    expect(map['半順序集合']).toBe('poset')
  })

  it('alias 重複時はアルファベット順で先勝ち (a より b が後)', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const defs = [
      { id: 'beta', aliases: ['共通語'], status: 'published' as const },
      { id: 'alpha', aliases: ['共通語'], status: 'published' as const },
    ]
    const map = buildAliasMap(defs)
    // アルファベット順で先勝ち → 'alpha' が勝つ
    expect(map['共通語']).toBe('alpha')
    consoleSpy.mockRestore()
  })

  it('alias 重複時に console.warn が呼ばれる', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const defs = [
      { id: 'alpha', aliases: ['共通語'], status: 'published' as const },
      { id: 'beta', aliases: ['共通語'], status: 'published' as const },
    ]
    buildAliasMap(defs)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('空の配列を渡すと空のマップを返す', () => {
    const map = buildAliasMap([])
    expect(map).toEqual({})
  })
})
