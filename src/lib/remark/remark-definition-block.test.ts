import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkDefinitionBlock from './remark-definition-block'

const process = (md: string) =>
  unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkDefinitionBlock)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(md)
    .toString()

describe('remarkDefinitionBlock', () => {
  it(':::definition ブロックを definition-block クラスの div に変換する', () => {
    const md = `:::definition\n半順序集合とは集合 P と関係の組である。\n:::`
    const html = process(md)
    expect(html).toContain('class="definition-block"')
    expect(html).toContain('半順序集合とは集合 P と関係の組である。')
    expect(html).toContain('</div>')
  })

  it(':::definition{#id} は変換をスキップする (ID 付きは local-definition が処理する)', () => {
    const md = `:::definition{#poset}\n半順序集合の定義。\n:::`
    const html = process(md)
    expect(html).not.toContain('class="definition-block"')
  })

  it('複数の :::definition がある場合、先頭は definition-block、2つ目以降は definition-block--extra になる', () => {
    const md = [
      ':::definition',
      '最初の定義。',
      ':::',
      '',
      ':::definition',
      '2番目の定義。',
      ':::',
    ].join('\n')
    const html = process(md)
    expect(html).toContain('class="definition-block"')
    expect(html).toContain('<div class="definition-block--extra">')
  })

  it('内部に $x + y$ を含む数式はそのまま HTML に含まれる', () => {
    const md = `:::definition\n$x + y$ は加算を表す。\n:::`
    const html = process(md)
    expect(html).toContain('class="definition-block"')
    expect(html).toContain('$x + y$')
  })

  it('内部が空の場合は空の div を出力する', () => {
    const md = `:::definition\n:::`
    const html = process(md)
    expect(html).toMatch(/<div[^>]*class="definition-block"[^>]*><\/div>/)
  })

  it('最初の :::definition の div に data-pagefind-body 属性が付く', () => {
    const md = `:::definition\n半順序集合とは集合 P と関係の組である。\n:::`
    const html = process(md)
    expect(html).toContain('data-pagefind-body')
    expect(html).toMatch(/<div[^>]*class="definition-block"[^>]*data-pagefind-body/)
  })

  it('複数の :::definition がある場合、最初の div のみ data-pagefind-body を持ち、2つ目は持たない', () => {
    const md = [
      ':::definition',
      '最初の定義。',
      ':::',
      '',
      ':::definition',
      '2番目の定義。',
      ':::',
    ].join('\n')
    const html = process(md)
    // 最初のブロックは data-pagefind-body を持つ
    expect(html).toMatch(/<div[^>]*class="definition-block"[^>]*data-pagefind-body/)
    // 2つ目のブロック (definition-block--extra) は data-pagefind-body を持たない
    expect(html).not.toMatch(/<div[^>]*class="definition-block--extra"[^>]*data-pagefind-body/)
    expect(html).not.toMatch(/data-pagefind-body[^>]*class="definition-block--extra"/)
  })

  it(':::definition{#id} (local definition) には data-pagefind-body が付かない', () => {
    const md = `:::definition{#poset}\n半順序集合の定義。\n:::`
    const html = process(md)
    expect(html).not.toContain('data-pagefind-body')
  })
})
