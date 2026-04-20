import { describe, it, expect } from 'vitest'
import { parseConceptLinks, parseEmbeds } from './parse-concept-links'

describe('parseConceptLinks', () => {
  it('[[term]] を抽出して term 文字列の配列を返す', () => {
    const result = parseConceptLinks('[[poset]] について説明する。')
    expect(result).toEqual(['poset'])
  })

  it('[[#id]] (先頭が #) は除外する', () => {
    const result = parseConceptLinks('[[#anchor]] はスキップする。')
    expect(result).toEqual([])
  })

  it('複数の [[term]] がある場合すべてを抽出する', () => {
    const result = parseConceptLinks('[[半順序集合]] において [[上界]] が存在するとは限らない。')
    expect(result).toEqual(['半順序集合', '上界'])
  })

  it('[[term]] が存在しない場合は空配列を返す', () => {
    const result = parseConceptLinks('普通のテキストです。')
    expect(result).toEqual([])
  })

  it('[[term]] と [[#anchor]] が混在する場合は [[term]] のみを返す', () => {
    const result = parseConceptLinks('[[poset]] と [[#local]] の話。')
    expect(result).toEqual(['poset'])
  })

  it('term にスペースを含む [[直積 集合]] もマッチする', () => {
    const result = parseConceptLinks('[[直積 集合]] について。')
    expect(result).toEqual(['直積 集合'])
  })
})

describe('parseEmbeds', () => {
  it('::embed[term] を抽出して term 文字列の配列を返す', () => {
    const result = parseEmbeds('::embed[poset]')
    expect(result).toEqual(['poset'])
  })

  it('複数の ::embed[term] をすべて抽出する', () => {
    const text = '::embed[poset]\n\n::embed[lattice]'
    const result = parseEmbeds(text)
    expect(result).toEqual(['poset', 'lattice'])
  })

  it('::embed[term] が存在しない場合は空配列を返す', () => {
    const result = parseEmbeds('普通のテキストです。')
    expect(result).toEqual([])
  })

  it('EMBED_REGEX は ^ 始まりのため行頭でない ::embed[term] はマッチしない', () => {
    // 行中に埋め込まれた ::embed は ^ アンカーにより無視される
    const result = parseEmbeds('文中に ::embed[poset] を書いても無視される')
    expect(result).toEqual([])
  })

  it('行頭の ::embed[term] と行中の ::embed[term] が混在する場合、行頭のみ抽出する', () => {
    const text = '::embed[poset]\n文中の ::embed[lattice] は無視'
    const result = parseEmbeds(text)
    expect(result).toEqual(['poset'])
  })

  it('日本語の term も抽出できる', () => {
    const result = parseEmbeds('::embed[半順序集合]')
    expect(result).toEqual(['半順序集合'])
  })
})
