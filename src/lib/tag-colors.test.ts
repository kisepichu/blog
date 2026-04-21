import { describe, it, expect } from 'vitest'
import { getTagColor } from './tag-colors'

describe('getTagColor', () => {
  it('設定ありのタグ「型理論」は lav の CSS vars を返す', () => {
    const result = getTagColor('型理論')
    expect(result).toEqual({
      bg: 'var(--lav-bg)',
      fg: 'var(--lav)',
      border: 'var(--lav-b)',
    })
  })

  it('設定ありのタグ「集合論」は sage の CSS vars を返す', () => {
    const result = getTagColor('集合論')
    expect(result).toEqual({
      bg: 'var(--sage-bg)',
      fg: 'var(--sage)',
      border: 'var(--sage-b)',
    })
  })

  it('設定なしの未知タグはハッシュで5色のいずれかを返す', () => {
    const pastelKeys = ['lav', 'peach', 'rose', 'sage', 'amber']
    const validBgVars = pastelKeys.map((k) => `var(--${k}-bg)`)
    const validFgVars = pastelKeys.map((k) => `var(--${k})`)
    const validBorderVars = pastelKeys.map((k) => `var(--${k}-b)`)

    const result = getTagColor('未知タグ')
    expect(validBgVars).toContain(result.bg)
    expect(validFgVars).toContain(result.fg)
    expect(validBorderVars).toContain(result.border)
  })

  it('同じ未知タグを2回呼ぶと同じ色が返る (決定論的)', () => {
    const result1 = getTagColor('決定論的テスト')
    const result2 = getTagColor('決定論的テスト')
    expect(result1).toEqual(result2)
  })

  it('異なる未知タグは必ずしも同じ色とは限らない (ハッシュが違えば別色)', () => {
    // charCodeAt の合計 % 5 が異なるタグを選んで、異なる結果が返ることを確認
    // 'a' = 97 → 97 % 5 = 2 (rose)
    // 'b' = 98 → 98 % 5 = 3 (sage)
    const resultA = getTagColor('a')
    const resultB = getTagColor('b')
    expect(resultA).not.toEqual(resultB)
  })

  it('返り値の bg が "var(--...)" 形式', () => {
    const result = getTagColor('型理論')
    expect(result.bg).toMatch(/^var\(--[a-z-]+\)$/)
  })

  it('返り値の fg が "var(--...)" 形式', () => {
    const result = getTagColor('型理論')
    expect(result.fg).toMatch(/^var\(--[a-z-]+\)$/)
  })

  it('返り値の border が "var(--...)" 形式', () => {
    const result = getTagColor('型理論')
    expect(result.border).toMatch(/^var\(--[a-z-]+\)$/)
  })

  it('返り値は { bg, fg, border } の3プロパティを持つ', () => {
    const result = getTagColor('型理論')
    expect(result).toHaveProperty('bg')
    expect(result).toHaveProperty('fg')
    expect(result).toHaveProperty('border')
  })
})
