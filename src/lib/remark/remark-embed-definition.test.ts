import { describe, it, expect, vi } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkEmbedDefinition from './remark-embed-definition'

const defContentMap = {
  poset: { title: '半順序集合', html: '<p><strong>半順序集合</strong>とは...</p>' },
  lattice: { title: '束', html: '<p><strong>束</strong>とは...</p>' },
}
const aliasMap = { poset: 'poset', '半順序': 'poset', lattice: 'lattice' }

const process = (md: string, isProd = false) =>
  unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkEmbedDefinition, { defContentMap, aliasMap, isProd })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .processSync(md)
    .toString()

describe('remarkEmbedDefinition', () => {
  it('::embed[poset] が definition-block definition-block--embedded クラスの div に変換される', () => {
    const html = process('::embed[poset]')
    expect(html).toContain('class="definition-block definition-block--embedded"')
  })

  it('::embed[poset] の出力に data-def-number="1" が付与される', () => {
    const html = process('::embed[poset]')
    expect(html).toContain('data-def-number="1"')
  })

  it('::embed[poset] の出力に <span class="definition-number">定義 1 (半順序集合)</span> が含まれる', () => {
    const html = process('::embed[poset]')
    expect(html).toContain('<span class="definition-number">定義 1 (半順序集合)</span>')
  })

  it('::embed[poset] の出力に defContentMap の html 内容が含まれる', () => {
    const html = process('::embed[poset]')
    expect(html).toContain('<p><strong>半順序集合</strong>とは...</p>')
  })

  it('alias 経由で解決 (::embed[半順序]) → 正しく埋め込まれる', () => {
    const html = process('::embed[半順序]')
    expect(html).toContain('class="definition-block definition-block--embedded"')
    expect(html).toContain('<p><strong>半順序集合</strong>とは...</p>')
  })

  it('複数の ::embed が連番の data-def-number を持つ', () => {
    const md = '::embed[poset]\n\n::embed[lattice]'
    const html = process(md)
    expect(html).toContain('data-def-number="1"')
    expect(html).toContain('data-def-number="2"')
  })

  it('複数の ::embed の <span class="definition-number"> がそれぞれ連番になる', () => {
    const md = '::embed[poset]\n\n::embed[lattice]'
    const html = process(md)
    expect(html).toContain('<span class="definition-number">定義 1 (半順序集合)</span>')
    expect(html).toContain('<span class="definition-number">定義 2 (束)</span>')
  })

  it('解決失敗 (isProd=false) → definition-block--embed-unresolved クラスの div が出力される', () => {
    const html = process('::embed[unknown-term]', false)
    expect(html).toContain('definition-block--embed-unresolved')
  })

  it('解決失敗 (isProd=false) → term テキストが含まれる', () => {
    const html = process('::embed[unknown-term]', false)
    expect(html).toContain('unknown-term')
  })

  it('解決失敗 (isProd=false) → embedded クラスは付かない', () => {
    const html = process('::embed[unknown-term]', false)
    expect(html).not.toContain('definition-block--embedded')
  })

  it('解決失敗 (isProd=true) → プレーンテキストとして出力される', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const html = process('::embed[unknown-term]', true)
    expect(html).not.toContain('definition-block')
    expect(html).toContain('unknown-term')
    consoleSpy.mockRestore()
  })

  it('解決失敗 (isProd=true) → console.warn が呼ばれる', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    process('::embed[unknown-term]', true)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('同じ Definition を複数回 embed するとそれぞれ別の定義番号が振られる', () => {
    const md = '::embed[poset]\n\n::embed[poset]'
    const html = process(md)
    expect(html).toContain('data-def-number="1"')
    expect(html).toContain('data-def-number="2"')
  })
})
