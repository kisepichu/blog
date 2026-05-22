import { describe, expect, it } from 'vitest'
import { extractDescription } from './extract-description'

describe('extractDescription', () => {
  it('空文字を返す (空入力)', () => {
    expect(extractDescription('', 120)).toBe('')
  })

  it('maxLen 以下の文字列はそのまま返す', () => {
    const text = 'hello world'
    expect(extractDescription(text, 120)).toBe('hello world')
  })

  it('maxLen を超える場合は切り詰めて … を付与する', () => {
    const text = 'a'.repeat(200)
    const result = extractDescription(text, 120)
    expect(result).toBe('a'.repeat(120) + '…')
  })

  it('HTML タグを除去したプレーンテキストを返す', () => {
    const html = '<p>半順序集合とは<strong>hoge</strong>である。</p>'
    expect(extractDescription(html, 120)).toBe('半順序集合とはhogeである。')
  })

  it('ネストした HTML タグも除去する', () => {
    const html = '<div class="definition-block"><p>内容<a href="/defs/poset">poset</a></p></div>'
    expect(extractDescription(html, 120)).toBe('内容poset')
  })

  it('maxLen ちょうどの場合は … を付与しない', () => {
    const text = 'a'.repeat(120)
    expect(extractDescription(text, 120)).toBe('a'.repeat(120))
  })

  it('改行・タブを空白に正規化する', () => {
    const text = '前の文。\n\n次の文。'
    const result = extractDescription(text, 120)
    expect(result).toBe('前の文。  次の文。')
  })
})
