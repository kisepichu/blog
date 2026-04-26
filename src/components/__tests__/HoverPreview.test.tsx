import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, act } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import React from 'react'

// HoverPreview コンポーネントをテスト対象としてインポート
import HoverPreview from '../HoverPreview'

// preview-index.json のモック
const mockPreviewIndex = {
  poset: { title: '半順序集合', html: '<p>poset の定義</p>' },
  'upper-bound': { title: '上界', html: '<p>upper-bound の定義</p>' },
}

beforeEach(() => {
  // fetch をモック
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockPreviewIndex,
  } as unknown as Response)

  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

/**
 * HoverPreview を描画し、mount 後の fetch 完了を待つ
 */
async function renderAndSettle(props: { baseUrl?: string } = {}) {
  let result: ReturnType<typeof render> | undefined
  await act(async () => {
    result = render(<HoverPreview baseUrl={props.baseUrl ?? '/'} />)
    // fetch (Promise) を解決させる
    await Promise.resolve()
    await Promise.resolve()
  })
  return result!
}

// ページ上に concept-link 要素を追加するヘルパー
function addGlobalConceptLink(term: string, text?: string): HTMLAnchorElement {
  const a = document.createElement('a')
  a.className = 'concept-link'
  a.dataset.term = term
  a.href = `/defs/${term}`
  a.textContent = text ?? term
  // getBoundingClientRect のスタブ (jsdom では常に 0 を返す)
  a.getBoundingClientRect = () => ({
    left: 100,
    right: 200,
    top: 50,
    bottom: 70,
    width: 100,
    height: 20,
    x: 100,
    y: 50,
    toJSON: () => ({}),
  })
  document.body.appendChild(a)
  return a
}

function addLocalConceptLink(localId: string, text?: string): HTMLAnchorElement {
  const a = document.createElement('a')
  a.className = 'concept-link concept-link--local'
  a.dataset.localId = localId
  a.href = `#${localId}`
  a.textContent = text ?? localId
  a.getBoundingClientRect = () => ({
    left: 100,
    right: 200,
    top: 50,
    bottom: 70,
    width: 100,
    height: 20,
    x: 100,
    y: 50,
    toJSON: () => ({}),
  })
  document.body.appendChild(a)
  return a
}

function addDefinitionBlock(id: string, innerHTML: string): HTMLDivElement {
  const div = document.createElement('div')
  div.className = 'definition-block'
  div.id = id
  div.innerHTML = innerHTML
  document.body.appendChild(div)
  return div
}

// ===========================
// テストスイート
// ===========================

describe('HoverPreview', () => {
  describe('global concept-link (data-term)', () => {
    it('global concept-link に mouseenter すると preview-index.json のタイトルを含む popup が表示される', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })

      expect(document.body).toHaveTextContent('半順序集合')
    })

    it('global concept-link に mouseenter すると preview-index.json の HTML を含む popup が表示される', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })

      // popup body に html が含まれる
      const popup = document.querySelector('.hover-preview')
      expect(popup).not.toBeNull()
      expect(popup?.querySelector('.hover-preview__body')?.innerHTML).toContain('poset の定義')
    })

    it('popup は document.body に描画される (portal)', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })

      // screen.getByText は document 全体を検索するため portal でも取得できる
      expect(screen.getByText('半順序集合')).toBeInTheDocument()
      // document.body 直下に .hover-preview が存在する
      expect(document.body.querySelector('.hover-preview')).not.toBeNull()
    })

    it('data-term が preview-index に存在しない場合は popup を表示しない', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('unknown-term')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })

      expect(document.body.querySelector('.hover-preview')).toBeNull()
    })
  })

  describe('local concept-link (data-local-id)', () => {
    it('local concept-link に mouseenter すると対応する DOM 要素の innerHTML を含む popup が表示される', async () => {
      await renderAndSettle()
      addDefinitionBlock('local-f', '<p>写像 f の定義</p>')
      const link = addLocalConceptLink('local-f')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })

      const popup = document.body.querySelector('.hover-preview')
      expect(popup).not.toBeNull()
      expect(popup?.querySelector('.hover-preview__body')?.innerHTML).toContain('写像 f の定義')
    })

    it('data-local-id に対応する DOM 要素がない場合は popup を表示しない', async () => {
      await renderAndSettle()
      // DOM 要素は追加しない
      const link = addLocalConceptLink('no-such-id')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })

      expect(document.body.querySelector('.hover-preview')).toBeNull()
    })
  })

  describe('タイマー・閉じる動作', () => {
    it('concept-link から mouseleave して 180ms 後に popup が消える', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })

      expect(document.body.querySelector('.hover-preview')).not.toBeNull()

      await act(async () => {
        fireEvent.mouseLeave(link)
        vi.advanceTimersByTime(200)
      })

      expect(document.body.querySelector('.hover-preview')).toBeNull()
    })

    it('mouseleave 後 180ms 経過前はまだ popup が残っている', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })

      await act(async () => {
        fireEvent.mouseLeave(link)
        vi.advanceTimersByTime(100)
      })

      // 100ms 経過時点ではまだ表示されている
      expect(document.body.querySelector('.hover-preview')).not.toBeNull()
    })

    it('popup が閉じた後に同じ concept-link を再 hover すると popup が再表示される', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      // 1回目 hover → popup 表示
      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })
      expect(document.body.querySelector('.hover-preview')).not.toBeNull()

      // mouseleave → 180ms 後に popup 消える
      await act(async () => {
        fireEvent.mouseLeave(link)
        vi.advanceTimersByTime(200)
      })
      expect(document.body.querySelector('.hover-preview')).toBeNull()

      // 2回目 hover → popup が再表示される
      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })
      expect(document.body.querySelector('.hover-preview')).not.toBeNull()
    })

    it('popup に mouseenter するとタイマーがキャンセルされ popup が残る', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })

      const popup = document.body.querySelector('.hover-preview') as HTMLElement
      expect(popup).not.toBeNull()

      await act(async () => {
        // link から出る → 閉じるタイマー開始
        fireEvent.mouseLeave(link)
        // popup に入る → タイマーキャンセル
        fireEvent.mouseEnter(popup)
        // 200ms 経過してもタイマーはキャンセル済みのため popup は残る
        vi.advanceTimersByTime(200)
      })

      expect(document.body.querySelector('.hover-preview')).not.toBeNull()
    })
  })

  describe('ネスト (スタック) 動作', () => {
    it('popup 内の concept-link に mouseenter すると子 popup が追加表示される (親は残る)', async () => {
      // preview-index に upper-bound も含める
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })

      // 親 popup 内に concept-link を追加
      const parentPopup = document.body.querySelector('.hover-preview') as HTMLElement
      expect(parentPopup).not.toBeNull()

      const childLink = document.createElement('a')
      childLink.className = 'concept-link'
      childLink.dataset.term = 'upper-bound'
      childLink.href = '/defs/upper-bound'
      childLink.textContent = 'upper-bound'
      childLink.getBoundingClientRect = () => ({
        left: 120,
        right: 220,
        top: 200,
        bottom: 220,
        width: 100,
        height: 20,
        x: 120,
        y: 200,
        toJSON: () => ({}),
      })
      parentPopup.querySelector('.hover-preview__body')?.appendChild(childLink)

      await act(async () => {
        fireEvent.mouseEnter(childLink)
        await Promise.resolve()
      })

      // 子 popup が追加される
      const allPopups = document.body.querySelectorAll('.hover-preview')
      expect(allPopups.length).toBeGreaterThanOrEqual(2)

      // 親 popup はまだ存在する
      expect(document.body.contains(parentPopup)).toBe(true)

      // 子 popup に upper-bound のタイトルが含まれる
      const bodyEl = within(document.body)
      expect(bodyEl.getByText('上界')).toBeInTheDocument()
    })

    it('Escape キーで全ての popup が閉じる', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })
      expect(document.body.querySelector('.hover-preview')).not.toBeNull()

      await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Escape' })
      })
      expect(document.body.querySelector('.hover-preview')).toBeNull()
    })

    it('concept-link に focus すると popup が表示される', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      await act(async () => {
        fireEvent.focus(link)
        await Promise.resolve()
      })
      expect(document.body.querySelector('.hover-preview')).not.toBeNull()
    })

    it('子 popup から mouseleave すると子のみ閉じる (親は残る)', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
      })

      const parentPopup = document.body.querySelector('.hover-preview') as HTMLElement

      // popup 内に子リンクを追加
      const childLink = document.createElement('a')
      childLink.className = 'concept-link'
      childLink.dataset.term = 'upper-bound'
      childLink.href = '/defs/upper-bound'
      childLink.textContent = 'upper-bound'
      childLink.getBoundingClientRect = () => ({
        left: 120,
        right: 220,
        top: 200,
        bottom: 220,
        width: 100,
        height: 20,
        x: 120,
        y: 200,
        toJSON: () => ({}),
      })
      parentPopup.querySelector('.hover-preview__body')?.appendChild(childLink)

      await act(async () => {
        fireEvent.mouseEnter(childLink)
        await Promise.resolve()
      })

      // 子 popup が追加されていることを確認
      expect(document.body.querySelectorAll('.hover-preview').length).toBeGreaterThanOrEqual(2)

      // 子 popup を取得 (2番目の popup)
      const popups = document.body.querySelectorAll('.hover-preview')
      const childPopup = popups[popups.length - 1] as HTMLElement

      await act(async () => {
        fireEvent.mouseLeave(childPopup)
        vi.advanceTimersByTime(200)
      })

      // 子 popup は閉じる
      expect(document.body.contains(childPopup)).toBe(false)
      // 親 popup は残る
      expect(document.body.contains(parentPopup)).toBe(true)
    })
  })
})
