import { describe, it, expect, vi } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkLocalDefinition from './remark-local-definition'
import remarkLocalBlock from './remark-local-block'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const process = (md: string) => {
  const file = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkLocalDefinition)
    .use(remarkLocalBlock)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(md)
  return { html: String(file), localIds: (file.data.localIds ?? new Set()) as Set<string> }
}

describe('remarkLocalBlock', () => {
  it(':::theorem{#id title="定理名"} を local-block theorem-block クラス付き div に変換する', () => {
    const { html } = process(':::theorem{#thm1 title="定理名"}\n内容\n:::')
    expect(html).toContain('local-block')
    expect(html).toContain('theorem-block')
    expect(html).toContain('id="thm1"')
    expect(html).toContain('data-block-title="定理名"')
  })

  it(':::theorem{#id} に data-block-label="定理" が付与される', () => {
    const { html } = process(':::theorem{#thm1}\n内容\n:::')
    expect(html).toContain('data-block-label="定理"')
  })

  it(':::theorem{#id} に colorToken lav の inline style が付与される', () => {
    const { html } = process(':::theorem{#thm1}\n内容\n:::')
    expect(html).toContain('--block-bg:var(--lav-bg)')
    expect(html).toContain('--block-b:var(--lav-b)')
    expect(html).toContain('--block-fg:var(--lav)')
  })

  it(':::example{#id} を local-block example-block クラス付き div に変換し data-pagefind-ignore を付与する', () => {
    const { html } = process(':::example{#ex1}\n内容\n:::')
    expect(html).toContain('local-block')
    expect(html).toContain('example-block')
    expect(html).toContain('id="ex1"')
    expect(html).toContain('data-pagefind-ignore')
  })

  it(':::example{#id} に data-block-label="例" が付与される', () => {
    const { html } = process(':::example{#ex1}\n内容\n:::')
    expect(html).toContain('data-block-label="例"')
  })

  it(':::remark{#id} を remark-block クラス付き div に変換する', () => {
    const { html } = process(':::remark{#rem1}\n内容\n:::')
    expect(html).toContain('remark-block')
    expect(html).toContain('id="rem1"')
  })

  it(':::notation{#id} を notation-block クラス付き div に変換する', () => {
    const { html } = process(':::notation{#not1}\n内容\n:::')
    expect(html).toContain('notation-block')
    expect(html).toContain('id="not1"')
  })

  it('title 省略時は id を data-block-title に使う', () => {
    const { html } = process(':::theorem{#thm1}\n内容\n:::')
    expect(html).toContain('data-block-title="thm1"')
  })

  it('title 前後の空白を除去して data-block-title に出力する', () => {
    const { html } = process(':::theorem{#thm1 title="  定理名  "}\n内容\n:::')
    expect(html).toContain('data-block-title="定理名"')
  })

  it('title が空白のみの場合は id を data-block-title に使う', () => {
    const { html } = process(':::theorem{#thm1 title="   "}\n内容\n:::')
    expect(html).toContain('data-block-title="thm1"')
  })

  it('{#id} なしは変換せず console.warn を出力する', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { html } = process(':::theorem\n内容\n:::')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('theorem'))
    expect(html).not.toContain('theorem-block')
    warnSpy.mockRestore()
  })

  it('id が file.data.localIds に追加される', () => {
    const { localIds } = process(':::theorem{#thm1}\n内容\n:::')
    expect(localIds.has('thm1')).toBe(true)
  })

  it('複数ブロックの id がすべて localIds に追加される', () => {
    const md = ':::theorem{#thm1}\nA\n:::\n\n:::example{#ex1}\nB\n:::'
    const { localIds } = process(md)
    expect(localIds.has('thm1')).toBe(true)
    expect(localIds.has('ex1')).toBe(true)
  })

  it(':::definition{#id} は remarkLocalBlock がスキップし remarkLocalDefinition が処理する', () => {
    const { html, localIds } = process(':::definition{#def1}\n内容\n:::')
    expect(html).toContain('class="definition-block"')
    expect(html).toContain('id="def1"')
    expect(html).not.toContain('definition-block-block')
    expect(localIds.has('def1')).toBe(true)
  })

  it('pagefindIgnore: false のブロック (theorem) に data-pagefind-ignore を付与しない', () => {
    const { html } = process(':::theorem{#thm1}\n内容\n:::')
    expect(html).not.toContain('data-pagefind-ignore')
  })

  it('内部コンテンツが空でも変換する', () => {
    const { html } = process(':::theorem{#thm1}\n:::')
    expect(html).toContain('theorem-block')
  })

  it('未知のディレクティブ名はスキップする', () => {
    const { html } = process(':::unknown{#id}\n内容\n:::')
    expect(html).not.toContain('unknown-block')
  })

  it('theorem と example が同一ページに混在する', () => {
    const md = ':::theorem{#thm1 title="定理"}\nA\n:::\n\n:::example{#ex1 title="例"}\nB\n:::'
    const { html } = process(md)
    expect(html).toContain('theorem-block')
    expect(html).toContain('example-block')
    expect(html).toContain('data-pagefind-ignore')
    // theorem は pagefindIgnore: false なので data-pagefind-ignore は theorem-block には付かない
    expect(html).not.toMatch(/theorem-block[^>]*data-pagefind-ignore/)
  })
})
