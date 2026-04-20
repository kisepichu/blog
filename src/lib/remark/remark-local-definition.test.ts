import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkDefinitionBlock from './remark-definition-block'
import remarkLocalDefinition from './remark-local-definition'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const process = (md: string) => {
  const file = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkDefinitionBlock)
    .use(remarkLocalDefinition)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(md)
  return { html: String(file), localIds: (file.data.localIds ?? new Set()) as Set<string> }
}

describe('remarkLocalDefinition', () => {
  it(':::definition{#id} を definition-block クラスと id 属性付きの div に変換する', () => {
    const md = `:::definition{#local-f}\n内容\n:::`
    const { html } = process(md)
    expect(html).toContain('class="definition-block"')
    expect(html).toContain('id="local-f"')
  })

  it(':::definition{#id} の id が file.data.localIds に追加される', () => {
    const md = `:::definition{#local-f}\n内容\n:::`
    const { localIds } = process(md)
    expect(localIds.has('local-f')).toBe(true)
  })

  it('複数の :::definition{#id} が全て変換され、両方の id が localIds に追加される', () => {
    const md = [
      ':::definition{#def-a}',
      '最初の定義。',
      ':::',
      '',
      ':::definition{#def-b}',
      '2番目の定義。',
      ':::',
    ].join('\n')
    const { html, localIds } = process(md)
    expect(html).toContain('id="def-a"')
    expect(html).toContain('id="def-b"')
    expect(localIds.has('def-a')).toBe(true)
    expect(localIds.has('def-b')).toBe(true)
  })

  it(':::definition (id なし) は local-definition がスキップし remarkDefinitionBlock が処理する', () => {
    const md = `:::definition\nid なしの定義。\n:::`
    const { html, localIds } = process(md)
    // remarkDefinitionBlock が処理した結果の definition-block クラスが付く
    expect(html).toContain('class="definition-block"')
    // id 属性は付かない
    expect(html).not.toContain('id="')
    // localIds には何も追加されない
    expect(localIds.size).toBe(0)
  })

  it('ローカル定義の内部コンテンツが HTML に含まれる', () => {
    const md = `:::definition{#my-def}\n半順序集合とは集合 P と関係の組である。\n:::`
    const { html } = process(md)
    expect(html).toContain('半順序集合とは集合 P と関係の組である。')
  })
})
