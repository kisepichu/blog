import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkAdmonition from './remark-admonition'

const process = (md: string) =>
  unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkAdmonition)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(md)
    .toString()

describe('remarkAdmonition', () => {
  it(':::warning を admonition--warning クラスの div に変換する', () => {
    const html = process(':::warning\n注意事項。\n:::')
    expect(html).toContain('class="admonition admonition--warning"')
    expect(html).toContain('注意事項。')
  })

  it(':::info を admonition--info クラスの div に変換する', () => {
    const html = process(':::info\n参考情報。\n:::')
    expect(html).toContain('class="admonition admonition--info"')
    expect(html).toContain('参考情報。')
  })

  it(':::tip を admonition--tip クラスの div に変換する', () => {
    const html = process(':::tip\nヒント内容。\n:::')
    expect(html).toContain('class="admonition admonition--tip"')
    expect(html).toContain('ヒント内容。')
  })

  it(':::note を admonition--note クラスの div に変換する', () => {
    const html = process(':::note\nメモ内容。\n:::')
    expect(html).toContain('class="admonition admonition--note"')
    expect(html).toContain('メモ内容。')
  })

  it('未知のディレクティブ名は変換しない', () => {
    const html = process(':::unknown\n内容。\n:::')
    expect(html).not.toContain('admonition')
  })

  it('内部に x + y を含む数式はそのまま通過する', () => {
    const html = process(':::warning\n$x + y$ の計算に注意。\n:::')
    expect(html).toContain('class="admonition admonition--warning"')
    expect(html).toContain('$x + y$')
  })

  it('内部が空の場合は空の div を出力する', () => {
    const html = process(':::info\n:::')
    expect(html).toMatch(/<div[^>]*class="admonition admonition--info"[^>]*><\/div>/)
  })

  it('data-pagefind-body 属性を付与しない', () => {
    const html = process(':::warning\n内容。\n:::')
    expect(html).not.toContain('data-pagefind-body')
  })

  it('複数の admonition を独立して変換する', () => {
    const md = ':::warning\n警告。\n:::' + '\n\n' + ':::info\n情報。\n:::'
    const html = process(md)
    expect(html).toContain('class="admonition admonition--warning"')
    expect(html).toContain('class="admonition admonition--info"')
  })
})
