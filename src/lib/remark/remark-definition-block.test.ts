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
    // class="definition-block" の完全一致 (definition-block--extra に誤マッチしない)
    expect(html).toMatch(/<div\b[^>]*\bclass="definition-block"[^>]*>/)
    expect(html).toContain('半順序集合とは集合 P と関係の組である。')
    expect(html).toContain('</div>')
  })

  it(':::definition{#id} は変換をスキップする (ID 付きは local-definition が処理する)', () => {
    const md = `:::definition{#poset}\n半順序集合の定義。\n:::`
    const html = process(md)
    expect(html).not.toMatch(/<div\b[^>]*\bclass="definition-block"[^>]*>/)
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
    // 属性順に依存しない: class と data-pagefind-body が同一 div タグに含まれることを確認
    expect(html).toMatch(/<div\b[^>]*\bclass="definition-block"[^>]*>/)
    expect(html).toMatch(/<div\b[^>]*\bdata-pagefind-body\b[^>]*>/)
    // 同一要素に両属性が存在することを確認 (どちらの順でも通る 2 パターン)
    const hasClassFirst = /<div\b[^>]*\bclass="definition-block"[^>]*\bdata-pagefind-body\b/.test(html)
    const hasBodyFirst  = /<div\b[^>]*\bdata-pagefind-body\b[^>]*\bclass="definition-block"/.test(html)
    expect(hasClassFirst || hasBodyFirst).toBe(true)
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
    // 最初のブロックに data-pagefind-body が存在する (属性順不問)
    const firstHasBodyFirst  = /<div\b[^>]*\bdata-pagefind-body\b[^>]*\bclass="definition-block"/.test(html)
    const firstHasClassFirst = /<div\b[^>]*\bclass="definition-block"[^>]*\bdata-pagefind-body\b/.test(html)
    expect(firstHasBodyFirst || firstHasClassFirst).toBe(true)
    // 2つ目のブロック (definition-block--extra) は data-pagefind-body を持たない (属性順不問)
    expect(html).not.toMatch(/<div\b[^>]*\bclass="definition-block--extra"[^>]*\bdata-pagefind-body\b/)
    expect(html).not.toMatch(/<div\b[^>]*\bdata-pagefind-body\b[^>]*\bclass="definition-block--extra"/)
  })

  it(':::definition{#id} (local definition) には data-pagefind-body が付かない', () => {
    const md = `:::definition{#poset}\n半順序集合の定義。\n:::`
    const html = process(md)
    expect(html).not.toContain('data-pagefind-body')
  })
})
