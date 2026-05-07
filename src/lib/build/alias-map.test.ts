import { describe, it, expect, vi } from 'vitest'
import { buildAliasMap, buildDefMetaMap } from './alias-map'

describe('buildAliasMap', () => {
  it('id 自体が alias として登録される', () => {
    const defs = [{ id: 'poset', title: 'dummy', english: 'dummy', aliases: [], status: 'published' as const }]
    const map = buildAliasMap(defs)
    expect(map['poset']).toBe('poset')
  })

  it('title が自動的に alias として登録される', () => {
    const defs = [
      { id: 'poset', title: '半順序集合', english: 'dummy', aliases: [], status: 'published' as const },
    ]
    const map = buildAliasMap(defs)
    expect(map['半順序集合']).toBe('poset')
  })

  it('aliases の各エントリが canonical id にマップされる', () => {
    const defs = [
      { id: 'poset', title: 'dummy', english: 'dummy', aliases: ['半順序', '半順序集合'], status: 'published' as const },
    ]
    const map = buildAliasMap(defs)
    expect(map['半順序']).toBe('poset')
    expect(map['半順序集合']).toBe('poset')
  })

  it('alias 重複時はアルファベット順で先勝ち (a より b が後)', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const defs = [
      { id: 'beta', title: 'ベータ', english: 'beta', aliases: ['共通語'], status: 'published' as const },
      { id: 'alpha', title: 'アルファ', english: 'alpha', aliases: ['共通語'], status: 'published' as const },
    ]
    const map = buildAliasMap(defs)
    // アルファベット順で先勝ち → 'alpha' が勝つ
    expect(map['共通語']).toBe('alpha')
    consoleSpy.mockRestore()
  })

  it('alias 重複時に console.warn が呼ばれる', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const defs = [
      { id: 'alpha', title: 'アルファ', english: 'alpha', aliases: ['共通語'], status: 'published' as const },
      { id: 'beta', title: 'ベータ', english: 'beta', aliases: ['共通語'], status: 'published' as const },
    ]
    buildAliasMap(defs)
    // '共通語' の重複で warn が呼ばれることを確認
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('共通語'))
    consoleSpy.mockRestore()
  })

  it('空の配列を渡すと空のマップを返す', () => {
    const map = buildAliasMap([])
    expect(map).toEqual({})
  })
})

describe('buildDefMetaMap', () => {
  it('id をキーに {title, english} が正しくマップされる', () => {
    const defs = [
      { id: 'poset', title: '半順序集合', english: 'partially ordered set', aliases: [], status: 'published' as const },
    ]
    const map = buildDefMetaMap(defs)
    expect(map['poset']).toEqual({ title: '半順序集合', english: 'partially ordered set' })
  })

  it('複数エントリが正しく登録される', () => {
    const defs = [
      { id: 'poset', title: '半順序集合', english: 'partially ordered set', aliases: [], status: 'published' as const },
      { id: 'lattice', title: '束', english: 'lattice', aliases: [], status: 'published' as const },
    ]
    const map = buildDefMetaMap(defs)
    expect(map['poset']).toEqual({ title: '半順序集合', english: 'partially ordered set' })
    expect(map['lattice']).toEqual({ title: '束', english: 'lattice' })
  })

  it('空配列を渡すと {} を返す', () => {
    const map = buildDefMetaMap([])
    expect(map).toEqual({})
  })

  it('english が空文字の場合もそのまま格納する', () => {
    const defs = [
      { id: 'term', title: '用語', english: '', aliases: [], status: 'draft' as const },
    ]
    const map = buildDefMetaMap(defs)
    expect(map['term']).toEqual({ title: '用語', english: '' })
  })
})
