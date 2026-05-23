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

  it('改行を空白に正規化し、連続空白をまとめる', () => {
    const text = '前の文。\n\n次の文。'
    const result = extractDescription(text, 120)
    expect(result).toBe('前の文。 次の文。')
  })

  it('Markdown :::directive ブロックを除去する', () => {
    const md = ':::definition\n半順序集合とは...\n:::\n補足説明'
    expect(extractDescription(md, 120)).toBe('補足説明')
  })

  it('Markdown 見出しを除去する', () => {
    const md = '## 節タイトル\n\n本文テキスト'
    expect(extractDescription(md, 120)).toBe('本文テキスト')
  })

  it('Markdown コードフェンスを除去する', () => {
    const md = '説明文\n```ts\nconst x = 1\n```\n続き'
    expect(extractDescription(md, 120)).toBe('説明文 続き')
  })

  it('インライン数式を除去する', () => {
    const md = '集合 $P$ と関係 $\\leq$ の組。'
    expect(extractDescription(md, 120)).toBe('集合 と関係 の組。')
  })

  it('ブロック数式を除去する', () => {
    const md = '定義:\n$$\na \\leq b\n$$\n以上より'
    expect(extractDescription(md, 120)).toBe('定義: 以上より')
  })

  it('[[concept-link]] を内側テキストに置換する', () => {
    const md = '[[半順序集合]] において [[上界]] が存在する。'
    expect(extractDescription(md, 120)).toBe('半順序集合 において 上界 が存在する。')
  })

  it('![[concept-link]] も内側テキストに置換する', () => {
    const md = 'この方法を **![[カリー化]]** と言う。'
    expect(extractDescription(md, 120)).toBe('この方法を カリー化 と言う。')
  })

  it('::embed[term] を除去する', () => {
    const md = '以下に定義を示す。\n\n::embed[poset]\n\n続き。'
    expect(extractDescription(md, 120)).toBe('以下に定義を示す。 続き。')
  })

  it('Markdown インライン装飾 (**bold**, *italic*, `code`) を除去する', () => {
    const md = '**太字** と *斜体* と `コード` がある。'
    expect(extractDescription(md, 120)).toBe('太字 と 斜体 と コード がある。')
  })
})
