import { describe, it, expect } from 'vitest'
import type { AliasMap } from './alias-map'
import { extractReferences, resolveLinks, getBacklinkGraph } from './backlink-graph'

describe('extractReferences', () => {
  it('[[term]] を抽出する', () => {
    const result = extractReferences('[[poset]] について説明する。')
    expect(result).toContain('poset')
  })

  it('::embed[term] を抽出する', () => {
    const result = extractReferences('::embed[lattice]')
    expect(result).toContain('lattice')
  })

  it('[[term]] と ::embed[term] が混在する場合、両方を抽出する', () => {
    const text = '[[poset]] について。\n::embed[lattice]'
    const result = extractReferences(text)
    expect(result).toContain('poset')
    expect(result).toContain('lattice')
  })

  it('[[#id]] は除外される', () => {
    const result = extractReferences('[[#anchor]] はスキップする。')
    expect(result).not.toContain('#anchor')
    expect(result).toEqual([])
  })

  it('参照がなければ空配列を返す', () => {
    const result = extractReferences('普通のテキストです。')
    expect(result).toEqual([])
  })
})

describe('resolveLinks', () => {
  it('alias-map で解決できる term は canonical id に変換される', () => {
    const aliasMap: AliasMap = { poset: 'poset', lattice: 'lattice' }
    const result = resolveLinks(['poset', 'lattice'], aliasMap)
    expect(result).toEqual(['poset', 'lattice'])
  })

  it('未解決の term は除外される', () => {
    const aliasMap: AliasMap = { poset: 'poset' }
    const result = resolveLinks(['poset', 'unknown-term'], aliasMap)
    expect(result).toEqual(['poset'])
    expect(result).not.toContain('unknown-term')
  })

  it('alias 経由で解決した場合も canonical id になる', () => {
    const aliasMap: AliasMap = { 半順序集合: 'poset', poset: 'poset' }
    const result = resolveLinks(['半順序集合'], aliasMap)
    expect(result).toEqual(['poset'])
  })
})

describe('getBacklinkGraph', () => {
  it('Post が Definition を [[term]] で参照 → BacklinkGraph に type: post のエントリが追加される', async () => {
    const aliasMap: AliasMap = { poset: 'poset' }
    const entries = [
      {
        type: 'post' as const,
        slug: 'my-post',
        title: 'My Post',
        body: '[[poset]] について。',
      },
    ]
    const graph = await getBacklinkGraph(entries, aliasMap)
    expect(graph['poset']).toBeDefined()
    expect(graph['poset']).toContainEqual({
      type: 'post',
      slug: 'my-post',
      title: 'My Post',
    })
  })

  it('Definition が Definition を参照 → type: definition のエントリが追加される', async () => {
    const aliasMap: AliasMap = { poset: 'poset', lattice: 'lattice' }
    const entries = [
      {
        type: 'definition' as const,
        slug: 'lattice',
        title: 'Lattice',
        body: '[[poset]] の特殊な場合。',
      },
    ]
    const graph = await getBacklinkGraph(entries, aliasMap)
    expect(graph['poset']).toBeDefined()
    expect(graph['poset']).toContainEqual({
      type: 'definition',
      slug: 'lattice',
      title: 'Lattice',
    })
  })

  it('::embed[term] による参照も backlink に含まれる', async () => {
    const aliasMap: AliasMap = { poset: 'poset' }
    const entries = [
      {
        type: 'post' as const,
        slug: 'embed-post',
        title: 'Embed Post',
        body: '::embed[poset]',
      },
    ]
    const graph = await getBacklinkGraph(entries, aliasMap)
    expect(graph['poset']).toBeDefined()
    expect(graph['poset']).toContainEqual({
      type: 'post',
      slug: 'embed-post',
      title: 'Embed Post',
    })
  })

  it('同じページから同じ Definition への複数参照は 1 件に集約される', async () => {
    const aliasMap: AliasMap = { poset: 'poset' }
    const entries = [
      {
        type: 'post' as const,
        slug: 'dup-post',
        title: 'Dup Post',
        body: '[[poset]] と [[poset]] を二度参照する。',
      },
    ]
    const graph = await getBacklinkGraph(entries, aliasMap)
    expect(graph['poset']).toBeDefined()
    const matches = graph['poset'].filter((e) => e.slug === 'dup-post')
    expect(matches).toHaveLength(1)
  })

  it('未解決の [[term]] は無視される', async () => {
    const aliasMap: AliasMap = {}
    const entries = [
      {
        type: 'post' as const,
        slug: 'unknown-post',
        title: 'Unknown Post',
        body: '[[unknown-term]] を参照する。',
      },
    ]
    const graph = await getBacklinkGraph(entries, aliasMap)
    expect(graph['unknown-term']).toBeUndefined()
  })

  it('自己参照は backlink に含まれる (除外しない)', async () => {
    const aliasMap: AliasMap = { poset: 'poset' }
    const entries = [
      {
        type: 'definition' as const,
        slug: 'poset',
        title: 'Poset',
        body: '[[poset]] は自己参照。',
      },
    ]
    const graph = await getBacklinkGraph(entries, aliasMap)
    expect(graph['poset']).toBeDefined()
    expect(graph['poset']).toContainEqual({
      type: 'definition',
      slug: 'poset',
      title: 'Poset',
    })
  })
})
