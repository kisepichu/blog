import { describe, expect, it } from 'vitest'
import { comparePostsByDateDesc, getVisiblePostsSorted } from './posts'

describe('comparePostsByDateDesc', () => {
  it('日付がある記事を日付なしの記事より前に並べる', () => {
    const dated = { data: { date: '2024-05-01', status: 'published' } }
    const undated = { data: { status: 'published' } }

    expect(comparePostsByDateDesc(dated, undated)).toBe(-1)
    expect(comparePostsByDateDesc(undated, dated)).toBe(1)
  })

  it('同じ日付なら 0 を返す', () => {
    const a = { data: { date: '2024-05-01', status: 'published' } }
    const b = { data: { date: '2024-05-01', status: 'draft' } }

    expect(comparePostsByDateDesc(a, b)).toBe(0)
  })
})

describe('getVisiblePostsSorted', () => {
  it('production では published の記事だけを返す', () => {
    const posts = [
      { data: { date: '2024-05-03', status: 'draft' } },
      { data: { date: '2024-05-02', status: 'published' } },
      { data: { date: '2024-05-01', status: 'private' } },
      { data: { status: 'published' } },
    ]

    expect(getVisiblePostsSorted(posts, true)).toEqual([
      { data: { date: '2024-05-02', status: 'published' } },
      { data: { status: 'published' } },
    ])
  })

  it('日付降順に並べ、日付なしの記事を末尾に置く', () => {
    const posts = [
      { data: { status: 'published' } },
      { data: { date: '2024-05-02', status: 'published' } },
      { data: { date: '2024-05-03', status: 'published' } },
    ]

    expect(getVisiblePostsSorted(posts, false)).toEqual([
      { data: { date: '2024-05-03', status: 'published' } },
      { data: { date: '2024-05-02', status: 'published' } },
      { data: { status: 'published' } },
    ])
  })
})
