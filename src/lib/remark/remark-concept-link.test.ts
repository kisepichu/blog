import { describe, it, expect, vi } from 'vitest'
import { unified } from 'unified'
import { VFile } from 'vfile'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkConceptLink from './remark-concept-link'

type AliasMap = Record<string, string>

const process = (md: string, aliasMap: AliasMap, isProd = false) =>
  unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkConceptLink, { aliasMap, baseUrl: '/', isProd })
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(md)
    .toString()

const processWithLocalIds = (md: string, localIds: Set<string>, aliasMap: AliasMap = {}, isProd = false) => {
  const vfile = new VFile({ value: md, data: { localIds } })
  return unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkConceptLink, { aliasMap, baseUrl: '/', isProd })
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(vfile)
    .toString()
}

describe('remarkConceptLink', () => {
  it('[[term]] が aliasMap で解決できる場合 concept-link クラスの a タグに変換される', () => {
    const aliasMap: AliasMap = { poset: 'poset' }
    const html = process('[[poset]] について説明する。', aliasMap)
    expect(html).toContain('class="concept-link"')
    expect(html).toContain('data-term="poset"')
    expect(html).toContain('href="/defs/poset"')
    expect(html).toContain('>poset<')
  })

  it('alias 経由で解決した場合も href は canonical id を使う', () => {
    const aliasMap: AliasMap = { '半順序集合': 'poset', poset: 'poset' }
    const html = process('[[半順序集合]] について説明する。', aliasMap)
    expect(html).toContain('href="/defs/poset"')
    expect(html).toContain('data-term="poset"')
    // リンクテキストは元の term をそのまま使う
    expect(html).toContain('>半順序集合<')
  })

  it('解決失敗かつ isProd=false のとき concept-link--unresolved クラスが付く', () => {
    const aliasMap: AliasMap = {}
    const html = process('[[未知の概念]] について。', aliasMap, false)
    expect(html).toContain('concept-link--unresolved')
    expect(html).toContain('>未知の概念<')
  })

  it('解決失敗かつ isProd=true のときプレーンテキストとして出力される', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const aliasMap: AliasMap = {}
    const html = process('[[未知の概念]] について。', aliasMap, true)
    expect(html).not.toContain('concept-link')
    expect(html).not.toContain('<a')
    expect(html).toContain('未知の概念')
    consoleSpy.mockRestore()
  })

  it('解決失敗かつ isProd=true のとき console.warn が呼ばれる', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const aliasMap: AliasMap = {}
    process('[[未知の概念]] について。', aliasMap, true)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('[[#anchor]] はスキップされて変換されない', () => {
    const aliasMap: AliasMap = {}
    const html = process('[[#anchor]] はスキップ。', aliasMap)
    expect(html).not.toContain('concept-link')
    expect(html).not.toContain('<a')
    // [[#anchor]] のテキストは元のまま残る
    expect(html).toContain('#anchor')
  })

  it('1つのテキストノードに複数の [[term]] があるとき、すべて変換される', () => {
    const aliasMap: AliasMap = { '半順序集合': 'poset', 上界: 'upper-bound' }
    const html = process('[[半順序集合]] において [[上界]] が存在する。', aliasMap)
    expect(html).toContain('href="/defs/poset"')
    expect(html).toContain('href="/defs/upper-bound"')
  })
})

describe('remarkConceptLink localIds 対応', () => {
  it('[[term]] かつ localIds に term がある場合 concept-link--local クラスと href="#term" になる', () => {
    const localIds = new Set(['term'])
    const html = processWithLocalIds('[[term]] について。', localIds)
    expect(html).toContain('concept-link--local')
    expect(html).toContain('href="#term"')
    expect(html).toContain('>term<')
  })

  it('[[term]] かつ localIds にある場合 global alias-map より優先される', () => {
    const localIds = new Set(['poset'])
    const aliasMap: AliasMap = { poset: 'poset' }
    const html = processWithLocalIds('[[poset]] について。', localIds, aliasMap)
    // global alias-map ではなく local リンクになる
    expect(html).toContain('concept-link--local')
    expect(html).toContain('href="#poset"')
    expect(html).not.toContain('href="/defs/poset"')
  })

  it('[[#id]] かつ localIds に id がある場合 concept-link--local クラスと href="#id" になる', () => {
    const localIds = new Set(['my-def'])
    const html = processWithLocalIds('[[#my-def]] を参照。', localIds)
    expect(html).toContain('concept-link--local')
    expect(html).toContain('href="#my-def"')
    expect(html).toContain('>my-def<')
  })

  it('[[#id]] かつ localIds にない場合 (isProd=false) concept-link--unresolved になる', () => {
    const localIds = new Set<string>()
    const html = processWithLocalIds('[[#unknown]] を参照。', localIds, {}, false)
    expect(html).toContain('concept-link--unresolved')
    expect(html).toContain('>unknown<')
  })

  it('[[#id]] かつ localIds にない場合 (isProd=true) プレーンテキストとして出力される', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const localIds = new Set<string>()
    const html = processWithLocalIds('[[#unknown]] を参照。', localIds, {}, true)
    expect(html).not.toContain('concept-link')
    expect(html).not.toContain('<a')
    expect(html).toContain('unknown')
    consoleSpy.mockRestore()
  })

  it('[[#id]] かつ localIds に id がある場合 data-local-id 属性が付与される', () => {
    const localIds = new Set(['local-f'])
    const html = processWithLocalIds('[[#local-f]] を参照。', localIds)
    expect(html).toContain('data-local-id="local-f"')
    expect(html).toContain('href="#local-f"')
    expect(html).toContain('concept-link--local')
  })

  it('[[term]] かつ localIds に term がある場合 data-local-id 属性が付与される', () => {
    const localIds = new Set(['local-f'])
    const html = processWithLocalIds('[[local-f]] について。', localIds)
    expect(html).toContain('data-local-id="local-f"')
    expect(html).toContain('href="#local-f"')
    expect(html).toContain('concept-link--local')
  })
})
