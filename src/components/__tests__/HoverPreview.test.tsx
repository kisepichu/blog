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

  describe('MathJax の typesetClear によるクリーンアップ (Issue #15)', () => {
    it('typesetPromise が実行中に popup が閉じられたとき、完了後に typesetClear で MathJax の追跡から除去する', async () => {
      // popup 1 の typesetPromise は手動で resolve する (popup が閉じられた後に完了させる)
      let resolveTypeset1!: () => void
      const typeset1Promise = new Promise<void>((resolve) => {
        resolveTypeset1 = resolve
      })

      let body1El: Element | null = null
      const typesetPromiseMock = vi.fn().mockImplementation((els: Element[]) => {
        if (body1El === null) {
          // 最初の呼び出しは popup 1 の body → 手動 resolve のプロミスを返す
          body1El = els[0]
          return typeset1Promise
        }
        // 2 回目以降は即時 resolve
        return Promise.resolve()
      })
      const typesetClearMock = vi.fn()

      type WindowWithMathJax = typeof window & {
        MathJax?: {
          startup?: { promise?: Promise<unknown> }
          typesetPromise?: (els: Element[]) => Promise<void>
          typesetClear?: (els: Element[]) => void
        }
      }
      ;(window as WindowWithMathJax).MathJax = {
        startup: { promise: Promise.resolve() },
        typesetPromise: typesetPromiseMock,
        typesetClear: typesetClearMock,
      }

      try {
        await renderAndSettle()
        const link1 = addGlobalConceptLink('poset')
        const link2 = addGlobalConceptLink('upper-bound')

        // popup 1 を開く
        await act(async () => {
          fireEvent.mouseEnter(link1)
          // useEffect の非同期処理 (startup.promise の await) を進める
          await Promise.resolve()
          await Promise.resolve()
          await Promise.resolve()
          // suppressNewPopupRef (setTimeout 0ms) をクリア
          vi.advanceTimersByTime(1)
        })

        // popup 1 が表示され、popup 1 の body が typesetPromise に渡された
        expect(document.body.querySelectorAll('.hover-preview').length).toBe(1)
        expect(body1El).not.toBeNull()

        // popup 2 を開く
        await act(async () => {
          fireEvent.mouseEnter(link2)
          await Promise.resolve()
          await Promise.resolve()
          await Promise.resolve()
        })

        expect(document.body.querySelectorAll('.hover-preview').length).toBe(2)

        // link1 から mouseleave → 180ms 後に popup 1 が閉じる
        await act(async () => {
          fireEvent.mouseLeave(link1)
          vi.advanceTimersByTime(200)
        })

        // popup 1 が閉じた。typesetClear はまだ呼ばれていない (typeset1Promise が未完了)
        expect(document.body.querySelectorAll('.hover-preview').length).toBe(1)
        expect(typesetClearMock).not.toHaveBeenCalled()

        // popup 1 の typesetPromise を resolve (popup はもう閉じている = cancelled = true)
        await act(async () => {
          resolveTypeset1()
          await Promise.resolve()
          await Promise.resolve()
          await Promise.resolve()
        })

        // typesetClear が popup 1 の body 要素に対して呼ばれた
        expect(typesetClearMock).toHaveBeenCalledTimes(1)
        expect(typesetClearMock).toHaveBeenCalledWith([body1El])

        // popup 2 は引き続き表示されている
        expect(document.body.querySelectorAll('.hover-preview').length).toBe(1)
      } finally {
        delete (window as WindowWithMathJax).MathJax
      }
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
        // popup 生成直後の mouseenter 抑制 (setTimeout 0ms) をクリアする
        vi.advanceTimersByTime(1)
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

    it('popup 内の同一 term の concept-link に mouseenter しても popup が増えない (Issue #32)', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
        // popup 生成直後の mouseenter 抑制 (setTimeout 0ms) をクリアする
        vi.advanceTimersByTime(1)
      })

      const parentPopup = document.body.querySelector('.hover-preview') as HTMLElement
      expect(parentPopup).not.toBeNull()
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(1)

      // 親 popup 内に同一 term (poset) の自己参照 concept-link を追加
      const selfRefLink = document.createElement('a')
      selfRefLink.className = 'concept-link'
      selfRefLink.dataset.term = 'poset'
      selfRefLink.href = '/defs/poset'
      selfRefLink.textContent = 'poset'
      selfRefLink.getBoundingClientRect = () => ({
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
      parentPopup.querySelector('.hover-preview__body')?.appendChild(selfRefLink)

      // 同一 term の self-reference link に mouseenter × 3 (cascade を再現)
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.mouseEnter(selfRefLink)
          await Promise.resolve()
          vi.advanceTimersByTime(1)
        })
      }

      // popup は増えない (同一 term なので子 popup を開かない)
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(1)
    })

    it('同一 localId を参照する別リンクに mouseenter しても popup が増えない (localId 重複抑止)', async () => {
      await renderAndSettle()
      addDefinitionBlock('local-g', '<p>写像 g の定義</p>')

      // 同じ localId を参照する 2 つのリンクを追加
      const link1 = addLocalConceptLink('local-g', 'g (1)')
      const link2 = addLocalConceptLink('local-g', 'g (2)')
      link2.getBoundingClientRect = () => ({
        left: 300, right: 400, top: 150, bottom: 170,
        width: 100, height: 20, x: 300, y: 150, toJSON: () => ({}),
      })

      // link1 hover → popup 表示
      await act(async () => {
        fireEvent.mouseEnter(link1)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })

      expect(document.body.querySelectorAll('.hover-preview').length).toBe(1)

      // link2 (同一 localId) hover × 3 → popup は増えない
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.mouseEnter(link2)
          await Promise.resolve()
          vi.advanceTimersByTime(1)
        })
      }

      expect(document.body.querySelectorAll('.hover-preview').length).toBe(1)
    })

    it('popup 内で term の popup が開いているとき、ページ上の同一 term 別要素にホバーしても popup が増えない (Issue #32 root cause)', async () => {
      // lattice が poset concept-link を含む HTML を返すようにモックを上書き
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          lattice: {
            title: '束',
            html: '<p><a href="/defs/poset" class="concept-link" data-term="poset">半順序集合</a>とは</p>',
          },
          poset: { title: '半順序集合', html: '<p>poset の定義</p>' },
        }),
      } as unknown as Response)

      await renderAndSettle()

      // ページ上に lattice concept-link と、別の poset concept-link を追加
      const latticeLink = addGlobalConceptLink('lattice')
      const pagePosetLink = addGlobalConceptLink('poset', '半順序集合')

      // lattice link にホバー → lattice popup (#1) が表示される
      await act(async () => {
        fireEvent.mouseEnter(latticeLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })

      const latticePopup = document.body.querySelector('.hover-preview') as HTMLElement
      expect(latticePopup).not.toBeNull()

      // lattice popup 内の poset link を取得
      const popupPosetLink = latticePopup.querySelector(
        '.concept-link[data-term="poset"]',
      ) as HTMLElement
      expect(popupPosetLink).not.toBeNull()
      popupPosetLink.getBoundingClientRect = () => ({
        left: 120, right: 220, top: 200, bottom: 220,
        width: 100, height: 20, x: 120, y: 200, toJSON: () => ({}),
      })

      // popup 内の poset link にホバー → poset popup (#2) が表示される
      await act(async () => {
        fireEvent.mouseEnter(popupPosetLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })

      expect(document.body.querySelectorAll('.hover-preview').length).toBe(2)

      // ページ上の別の poset link (popup 外) に mouseenter × 3
      // → 同一 term の popup が既に存在するので増えないこと
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.mouseEnter(pagePosetLink)
          await Promise.resolve()
          vi.advanceTimersByTime(1)
        })
      }

      // popup は 2 つのまま (lattice + poset)、重複して増えない
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(2)
    })

    it('popup 内リンクで開いた popup がページリンクから再利用されると、元の親 popup の mouseleave で閉じない', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          lattice: {
            title: '束',
            html: '<p><a href="/defs/poset" class="concept-link" data-term="poset">半順序集合</a>とは</p>',
          },
          poset: { title: '半順序集合', html: '<p>poset の定義</p>' },
        }),
      } as unknown as Response)

      await renderAndSettle()
      const latticeLink = addGlobalConceptLink('lattice')
      const pagePosetLink = addGlobalConceptLink('poset', '半順序集合')

      // lattice popup を開く
      await act(async () => {
        fireEvent.mouseEnter(latticeLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })

      const latticePopup = document.body.querySelector('.hover-preview') as HTMLElement

      // lattice popup 内の poset link から poset popup を開く (parentId = lattice popup id)
      const popupPosetLink = latticePopup.querySelector('.concept-link[data-term="poset"]') as HTMLElement
      popupPosetLink.getBoundingClientRect = () => ({
        left: 120, right: 220, top: 200, bottom: 220,
        width: 100, height: 20, x: 120, y: 200, toJSON: () => ({}),
      })
      await act(async () => {
        fireEvent.mouseEnter(popupPosetLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(2)

      // ページ上の poset link hover → poset popup の parentId が null に更新される
      await act(async () => {
        fireEvent.mouseEnter(pagePosetLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(2)

      // lattice popup から mouseleave → lattice popup が閉じる
      await act(async () => {
        fireEvent.mouseLeave(latticePopup)
        vi.advanceTimersByTime(200)
      })

      // lattice popup は閉じる。poset popup は parentId が null に更新済みなので閉じない
      const remainingPopups = document.body.querySelectorAll('.hover-preview')
      expect(remainingPopups.length).toBe(1)
      expect(remainingPopups[0].querySelector('.hover-preview__title')?.textContent).toBe('半順序集合')
    })

    it('duplicate popup が別リンクから再利用されると、その子孫 popup が閉じる', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          poset: {
            title: '半順序集合',
            html: '<p><a href="/defs/upper-bound" class="concept-link" data-term="upper-bound">上界</a></p>',
          },
          'upper-bound': { title: '上界', html: '<p>上界の定義</p>' },
        }),
      } as unknown as Response)

      await renderAndSettle()
      const link1 = addGlobalConceptLink('poset', 'poset (1)')
      const link2 = addGlobalConceptLink('poset', 'poset (2)')
      link2.getBoundingClientRect = () => ({
        left: 300, right: 400, top: 150, bottom: 170,
        width: 100, height: 20, x: 300, y: 150, toJSON: () => ({}),
      })

      // link1 から poset popup を開く
      await act(async () => {
        fireEvent.mouseEnter(link1)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(1)

      // poset popup 内の upper-bound link をクリック → 子 popup を開く
      const posetPopup = document.body.querySelector('.hover-preview') as HTMLElement
      const childLink = posetPopup.querySelector('.concept-link[data-term="upper-bound"]') as HTMLElement
      expect(childLink).not.toBeNull()
      childLink.getBoundingClientRect = () => ({
        left: 120, right: 220, top: 200, bottom: 220,
        width: 100, height: 20, x: 120, y: 200, toJSON: () => ({}),
      })
      await act(async () => {
        fireEvent.mouseEnter(childLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(2)

      // link2 (同一 term) から hover → poset popup が再利用され、子 popup (upper-bound) は閉じる
      await act(async () => {
        fireEvent.mouseEnter(link2)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })

      // poset popup は残り、upper-bound の子 popup は閉じている
      const remaining = document.body.querySelectorAll('.hover-preview')
      expect(remaining.length).toBe(1)
      expect(remaining[0].querySelector('.hover-preview__title')?.textContent).toBe('半順序集合')
    })

    it('popup 内の self-reference リンク hover では子孫 popup が閉じない', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          poset: {
            title: '半順序集合',
            // 自己参照 (poset) と子リンク (upper-bound) を含む
            html: '<p><a href="/defs/poset" class="concept-link" data-term="poset">poset</a> と <a href="/defs/upper-bound" class="concept-link" data-term="upper-bound">上界</a></p>',
          },
          'upper-bound': { title: '上界', html: '<p>上界の定義</p>' },
        }),
      } as unknown as Response)

      await renderAndSettle()
      const pageLink = addGlobalConceptLink('poset', '半順序集合')

      // poset popup を開く
      await act(async () => {
        fireEvent.mouseEnter(pageLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })
      const posetPopup = document.body.querySelector('.hover-preview') as HTMLElement
      expect(posetPopup).not.toBeNull()

      // popup 内の upper-bound リンクを hover → 子 popup を開く
      const upperBoundLink = posetPopup.querySelector('.concept-link[data-term="upper-bound"]') as HTMLElement
      upperBoundLink.getBoundingClientRect = () => ({
        left: 120, right: 220, top: 200, bottom: 220,
        width: 100, height: 20, x: 120, y: 200, toJSON: () => ({}),
      })
      await act(async () => {
        fireEvent.mouseEnter(upperBoundLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(2)

      // popup 内の self-reference (poset) リンクを hover → 子孫 popup は閉じない
      const selfRefLink = posetPopup.querySelector('.concept-link[data-term="poset"]') as HTMLElement
      selfRefLink.getBoundingClientRect = () => ({
        left: 110, right: 210, top: 180, bottom: 200,
        width: 100, height: 20, x: 110, y: 180, toJSON: () => ({}),
      })
      await act(async () => {
        fireEvent.mouseEnter(selfRefLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })

      // poset + upper-bound の 2 つが残っている
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(2)
    })

    it('duplicate popup が別リンクから再利用されると zIndex が新しい親より高くなる', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          poset: { title: '半順序集合', html: '<p>poset の定義</p>' },
          'upper-bound': {
            title: '上界',
            html: '<p><a href="/defs/poset" class="concept-link" data-term="poset">半順序集合</a></p>',
          },
        }),
      } as unknown as Response)

      await renderAndSettle()
      const pagePosetLink = addGlobalConceptLink('poset', '半順序集合')
      const upperBoundLink = addGlobalConceptLink('upper-bound', '上界')

      // poset popup を開く (古い id → 低い zIndex)
      await act(async () => {
        fireEvent.mouseEnter(pagePosetLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })
      const posetPopupEl = document.body.querySelector('.hover-preview') as HTMLElement
      const oldZIndex = Number(posetPopupEl.style.zIndex)

      // upper-bound popup を開く (新しい id → 高い zIndex)
      await act(async () => {
        fireEvent.mouseEnter(upperBoundLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(2)
      const upperBoundPopupEl = Array.from(document.body.querySelectorAll('.hover-preview')).find(
        (el) => el.querySelector('.hover-preview__title')?.textContent === '上界'
      ) as HTMLElement
      const upperBoundZIndex = Number(upperBoundPopupEl.style.zIndex)
      expect(upperBoundZIndex).toBeGreaterThan(oldZIndex)

      // upper-bound popup 内の poset link から poset を再利用
      const popupPosetLink = upperBoundPopupEl.querySelector('.concept-link[data-term="poset"]') as HTMLElement
      popupPosetLink.getBoundingClientRect = () => ({
        left: 120, right: 220, top: 200, bottom: 220,
        width: 100, height: 20, x: 120, y: 200, toJSON: () => ({}),
      })
      await act(async () => {
        fireEvent.mouseEnter(popupPosetLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })

      // reuse された poset popup の zIndex が upper-bound popup より高い
      const newPosetZIndex = Number(posetPopupEl.style.zIndex)
      expect(newPosetZIndex).toBeGreaterThan(upperBoundZIndex)
    })

    it('子 popup から mouseleave すると子のみ閉じる (親は残る)', async () => {
      await renderAndSettle()
      const link = addGlobalConceptLink('poset')

      await act(async () => {
        fireEvent.mouseEnter(link)
        await Promise.resolve()
        // popup 生成直後の mouseenter 抑制 (setTimeout 0ms) をクリアする
        vi.advanceTimersByTime(1)
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

  describe('新しい親の close タイマー解除', () => {
    it('popup を popup 内リンクから再利用したとき、新しい親の close タイマーがキャンセルされる', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          poset: { title: '半順序集合', html: '<p>poset の定義</p>' },
          lattice: {
            title: '束',
            html: '<p><a href="/defs/poset" class="concept-link" data-term="poset">半順序集合</a></p>',
          },
        }),
      } as unknown as Response)

      await renderAndSettle()
      const pagePosetLink = addGlobalConceptLink('poset', '半順序集合 (page)')
      const latticeLinkEl = addGlobalConceptLink('lattice', '束')

      // poset popup を開く
      await act(async () => {
        fireEvent.mouseEnter(pagePosetLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(1)

      // lattice popup を開く
      await act(async () => {
        fireEvent.mouseEnter(latticeLinkEl)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(2)

      const latticePopup = Array.from(document.body.querySelectorAll('.hover-preview')).find(
        (el) => el.querySelector('.hover-preview__title')?.textContent === '束'
      ) as HTMLElement

      // lattice popup から mouseleave → close タイマー開始 (180ms)
      await act(async () => {
        fireEvent.mouseLeave(latticePopup)
        // 100ms 経過 (まだ消えていない)
        vi.advanceTimersByTime(100)
      })
      expect(document.body.contains(latticePopup)).toBe(true)

      // lattice popup 内の poset link を hover → poset popup が再利用され、lattice の close タイマーがキャンセルされる
      const popupPosetLink = latticePopup.querySelector('.concept-link[data-term="poset"]') as HTMLElement
      popupPosetLink.getBoundingClientRect = () => ({
        left: 120, right: 220, top: 200, bottom: 220,
        width: 100, height: 20, x: 120, y: 200, toJSON: () => ({}),
      })
      await act(async () => {
        fireEvent.mouseEnter(popupPosetLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })

      // さらに 100ms 経過しても lattice popup は閉じない (タイマーがキャンセルされているため)
      await act(async () => {
        vi.advanceTimersByTime(100)
      })
      expect(document.body.contains(latticePopup)).toBe(true)
      // poset popup (reused) も残っている
      expect(document.body.querySelectorAll('.hover-preview').length).toBe(2)
    })
  })

  describe('MathJax typeset 保持', () => {
    it('子 popup を開いても親 popup の hover-preview__body innerHTML がリセットされない (Issue: TeX revert)', async () => {
      // lattice が poset concept-link を含む HTML を返すようにモックを上書き
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          lattice: {
            title: '束',
            html: '<p>TeX: $(L,\\leq)$</p><p><a href="/defs/poset" class="concept-link" data-term="poset">半順序集合</a></p>',
          },
          poset: { title: '半順序集合', html: '<p>TeX: $P$</p>' },
        }),
      } as unknown as Response)

      await renderAndSettle()

      const latticeLink = addGlobalConceptLink('lattice')

      // lattice popup を開く
      await act(async () => {
        fireEvent.mouseEnter(latticeLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })

      const latticePopup = document.body.querySelector('.hover-preview') as HTMLElement
      expect(latticePopup).not.toBeNull()
      const latticeBody = latticePopup.querySelector('.hover-preview__body') as HTMLElement
      expect(latticeBody).not.toBeNull()

      // MathJax が TeX を描画したと仮定して innerHTML を書き換える
      const renderedTeX = '<p>TeX: <math>...</math></p><p><a href="/defs/poset" class="concept-link" data-term="poset">半順序集合</a></p>'
      latticeBody.innerHTML = renderedTeX

      // popup 内の poset link を取得して hover → 子 popup を開く
      const popupPosetLink = latticeBody.querySelector(
        '.concept-link[data-term="poset"]',
      ) as HTMLElement
      expect(popupPosetLink).not.toBeNull()
      popupPosetLink.getBoundingClientRect = () => ({
        left: 120, right: 220, top: 200, bottom: 220,
        width: 100, height: 20, x: 120, y: 200, toJSON: () => ({}),
      })

      await act(async () => {
        fireEvent.mouseEnter(popupPosetLink)
        await Promise.resolve()
        vi.advanceTimersByTime(1)
      })

      expect(document.body.querySelectorAll('.hover-preview').length).toBe(2)

      // 子 popup を開いた後も親 popup の body innerHTML がリセットされていないこと
      expect(latticeBody.innerHTML).toBe(renderedTeX)
    })
  })
})
