import { vi, describe, it, expect, beforeEach } from 'vitest'

// fs モジュールをモック
vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}))

import { writeFileSync } from 'node:fs'
import { writePreviewIndex } from './preview-index'
import type { DefContentMap } from './def-content-map'

describe('writePreviewIndex', () => {
  beforeEach(() => {
    vi.mocked(writeFileSync).mockClear()
  })

  it('writeFileSync が指定した path で呼ばれる', () => {
    const map: DefContentMap = {
      poset: { title: '半順序集合', html: '<p><strong>半順序集合</strong>とは集合 P と関係の組である。</p>' },
    }
    writePreviewIndex(map, '/output/preview-index.json')
    expect(writeFileSync).toHaveBeenCalledOnce()
    expect(vi.mocked(writeFileSync).mock.calls[0][0]).toBe('/output/preview-index.json')
  })

  it('writeFileSync に渡される内容が defContentMap と一致する (title と html が含まれる)', () => {
    const map: DefContentMap = {
      poset: { title: '半順序集合', html: '<p><strong>半順序集合</strong>とは集合 P と関係の組である。</p>' },
    }
    writePreviewIndex(map, '/output/preview-index.json')
    const written = vi.mocked(writeFileSync).mock.calls[0][1] as string
    const parsed = JSON.parse(written)
    expect(parsed['poset']).toBeDefined()
    expect(parsed['poset'].title).toBe('半順序集合')
    expect(parsed['poset'].html).toBe('<p><strong>半順序集合</strong>とは集合 P と関係の組である。</p>')
  })

  it('空の defContentMap を渡すと {} が書き出される', () => {
    const map: DefContentMap = {}
    writePreviewIndex(map, '/output/preview-index.json')
    const written = vi.mocked(writeFileSync).mock.calls[0][1] as string
    expect(JSON.parse(written)).toEqual({})
  })

  it('複数エントリがある場合すべてのエントリが JSON に含まれる', () => {
    const map: DefContentMap = {
      poset: { title: '半順序集合', html: '<p>半順序集合の定義。</p>' },
      lattice: { title: '束', html: '<p>束の定義。</p>' },
      monoid: { title: 'モノイド', html: '<p>モノイドの定義。</p>' },
    }
    writePreviewIndex(map, '/output/preview-index.json')
    const written = vi.mocked(writeFileSync).mock.calls[0][1] as string
    const parsed = JSON.parse(written)
    expect(Object.keys(parsed)).toHaveLength(3)
    expect(parsed['poset'].title).toBe('半順序集合')
    expect(parsed['lattice'].title).toBe('束')
    expect(parsed['monoid'].title).toBe('モノイド')
  })
})
