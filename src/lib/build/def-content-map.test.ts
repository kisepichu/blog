import { describe, it, expect, vi } from 'vitest'
import { buildDefContentMap } from './def-content-map'
import type { DefEntry, AliasMap } from './alias-map'

// テスト用のエントリ型 (buildDefContentMap に渡す)
type DefEntryWithContent = DefEntry & { title: string; body: string }

describe('buildDefContentMap', () => {
  it(':::definition ブロックを持つエントリの title と html が登録される', async () => {
    const defs: DefEntryWithContent[] = [
      {
        id: 'poset',
        aliases: [],
        status: 'published',
        title: '半順序集合',
        english: '',
        body: ':::definition\n**半順序集合**とは集合 P と関係の組である。\n:::',
      },
    ]
    const aliasMap: AliasMap = { poset: 'poset' }
    const map = await buildDefContentMap(defs, aliasMap, {}, '/')
    expect(map).toHaveProperty('poset')
    expect(map['poset'].title).toBe('半順序集合')
    expect(map['poset'].html).toContain('半順序集合')
  })

  it(':::definition ブロックの内側の HTML を html フィールドに格納する (外側 div は含まない)', async () => {
    const defs: DefEntryWithContent[] = [
      {
        id: 'poset',
        aliases: [],
        status: 'published',
        title: '半順序集合',
        english: '',
        body: ':::definition\n**半順序集合**とは集合 P と関係の組である。\n:::',
      },
    ]
    const aliasMap: AliasMap = { poset: 'poset' }
    const map = await buildDefContentMap(defs, aliasMap, {}, '/')
    // 外側の div は含まない
    expect(map['poset'].html).not.toContain('class="definition-block"')
    // 内部のコンテンツを含む
    expect(map['poset'].html).toContain('<strong>半順序集合</strong>')
  })

  it(':::definition なしのエントリはマップに含まれない', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const defs: DefEntryWithContent[] = [
      {
        id: 'no-def',
        aliases: [],
        status: 'published',
        title: 'テスト',
        english: '',
        body: '普通の段落。:::definition ブロックなし。',
      },
    ]
    const aliasMap: AliasMap = { 'no-def': 'no-def' }
    const map = await buildDefContentMap(defs, aliasMap, {}, '/')
    expect(map).not.toHaveProperty('no-def')
    consoleSpy.mockRestore()
  })

  it(':::definition なしのエントリがある場合 console.warn が呼ばれる', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const defs: DefEntryWithContent[] = [
      {
        id: 'no-def',
        aliases: [],
        status: 'published',
        title: 'テスト',
        english: '',
        body: '普通の段落。:::definition ブロックなし。',
      },
    ]
    const aliasMap: AliasMap = { 'no-def': 'no-def' }
    await buildDefContentMap(defs, aliasMap, {}, '/')
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('複数エントリを同時に処理し、すべて登録される', async () => {
    const defs: DefEntryWithContent[] = [
      {
        id: 'poset',
        aliases: [],
        status: 'published',
        title: '半順序集合',
        english: '',
        body: ':::definition\n**半順序集合**の定義。\n:::',
      },
      {
        id: 'lattice',
        aliases: [],
        status: 'published',
        title: '束',
        english: '',
        body: ':::definition\n**束**の定義。\n:::',
      },
    ]
    const aliasMap: AliasMap = { poset: 'poset', lattice: 'lattice' }
    const map = await buildDefContentMap(defs, aliasMap, {}, '/')
    expect(map).toHaveProperty('poset')
    expect(map).toHaveProperty('lattice')
    expect(map['poset'].title).toBe('半順序集合')
    expect(map['lattice'].title).toBe('束')
  })

  it(':::definition ありのエントリと なしのエントリが混在する場合、あるものだけ登録される', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const defs: DefEntryWithContent[] = [
      {
        id: 'poset',
        aliases: [],
        status: 'published',
        title: '半順序集合',
        english: '',
        body: ':::definition\n**半順序集合**の定義。\n:::',
      },
      {
        id: 'stub',
        aliases: [],
        status: 'draft',
        title: 'スタブ',
        english: '',
        body: '定義なし。',
      },
    ]
    const aliasMap: AliasMap = { poset: 'poset', stub: 'stub' }
    const map = await buildDefContentMap(defs, aliasMap, {}, '/')
    expect(map).toHaveProperty('poset')
    expect(map).not.toHaveProperty('stub')
    consoleSpy.mockRestore()
  })

  it('空の配列を渡すと空のマップを返す', async () => {
    const map = await buildDefContentMap([], {}, {}, '/')
    expect(map).toEqual({})
  })

  it('結果のキーは canonical id になる', async () => {
    const defs: DefEntryWithContent[] = [
      {
        id: 'poset',
        aliases: ['半順序', '半順序集合'],
        status: 'published',
        title: '半順序集合',
        english: '',
        body: ':::definition\n**半順序集合**の定義。\n:::',
      },
    ]
    const aliasMap: AliasMap = { poset: 'poset', '半順序': 'poset', '半順序集合': 'poset' }
    const map = await buildDefContentMap(defs, aliasMap, {}, '/')
    // canonical id でのみ登録される
    expect(Object.keys(map)).toEqual(['poset'])
  })
})
