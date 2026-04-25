import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import React from 'react'

// SearchInterface コンポーネントをテスト対象としてインポート
import SearchInterface from '../SearchInterface'

// pagefind モック
const mockFilters = vi.fn().mockResolvedValue({
  tags: { '集合論': 3, '型理論': 5 },
  type: { post: 4, definition: 10 },
})

const mockSearch = vi.fn().mockResolvedValue({ results: [] })
const mockInit = vi.fn().mockResolvedValue(undefined)

// SearchInterface は `${baseUrl}pagefind/pagefind.js` を動的インポートする。
// テストでは baseUrl='/test-base/' と渡し、そのパスをモックする。
vi.mock('/test-base/pagefind/pagefind.js', () => ({
  default: {
    init: mockInit,
    filters: mockFilters,
    search: mockSearch,
  },
  init: mockInit,
  filters: mockFilters,
  search: mockSearch,
}))

// ---

beforeEach(() => {
  vi.clearAllMocks()
  mockFilters.mockResolvedValue({
    tags: { '集合論': 3, '型理論': 5 },
    type: { post: 4, definition: 10 },
  })
  mockSearch.mockResolvedValue({ results: [] })
  mockInit.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

/**
 * SearchInterface を描画し、Pagefind 初期化の非同期処理を待つ
 */
async function renderAndSettle(props: { initialQuery?: string; baseUrl?: string } = {}) {
  let result: ReturnType<typeof render> | undefined
  await act(async () => {
    result = render(
      <SearchInterface
        initialQuery={props.initialQuery ?? ''}
        baseUrl={props.baseUrl ?? '/test-base/'}
      />,
    )
    await Promise.resolve()
    await Promise.resolve()
  })
  return result! as ReturnType<typeof render>
}

// ===========================
// テストスイート
// ===========================

describe('SearchInterface', () => {
  describe('prefix filter — タグ候補表示', () => {
    it('`#` を入力したとき、pagefind.filters() から取得した全タグ候補がドロップダウンに表示される', async () => {
      await renderAndSettle()

      const input = screen.getByRole('textbox')

      await act(async () => {
        fireEvent.change(input, { target: { value: '#' } })
        await Promise.resolve()
        await Promise.resolve()
      })

      // 全タグが表示される
      await waitFor(() => {
        expect(screen.getByText('集合論')).toBeInTheDocument()
        expect(screen.getByText('型理論')).toBeInTheDocument()
      })
    })

    it('`#型` を入力したとき、「型理論」のみ候補に表示される (部分一致)', async () => {
      await renderAndSettle()

      const input = screen.getByRole('textbox')

      await act(async () => {
        fireEvent.change(input, { target: { value: '#型' } })
        await Promise.resolve()
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(screen.getByText('型理論')).toBeInTheDocument()
        expect(screen.queryByText('集合論')).not.toBeInTheDocument()
      })
    })
  })

  describe('prefix filter — type 候補表示', () => {
    it('`@` を入力したとき、`post` / `definition` の候補がドロップダウンに表示される', async () => {
      await renderAndSettle()

      const input = screen.getByRole('textbox')

      await act(async () => {
        fireEvent.change(input, { target: { value: '@' } })
        await Promise.resolve()
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(screen.getByText('post')).toBeInTheDocument()
        expect(screen.getByText('definition')).toBeInTheDocument()
      })
    })
  })

  describe('filter chip 追加', () => {
    it('タグ候補をクリックすると filter chip が追加され、input がクリアされる', async () => {
      await renderAndSettle()

      const input = screen.getByRole('textbox')

      await act(async () => {
        fireEvent.change(input, { target: { value: '#' } })
        await Promise.resolve()
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(screen.getByText('集合論')).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('集合論'))
        await Promise.resolve()
      })

      // filter chip が追加される (chip 内に「集合論」が表示される)
      await waitFor(() => {
        // input は空になる
        expect(input).toHaveValue('')
        // chip として「集合論」が表示されている
        // chip は削除ボタンを含むので、getAllByText で複数ヒットしても良い
        const chips = document.querySelectorAll('[data-filter-chip]')
        expect(chips.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('type 候補を選択すると type chip が追加される', async () => {
      await renderAndSettle()

      const input = screen.getByRole('textbox')

      await act(async () => {
        fireEvent.change(input, { target: { value: '@' } })
        await Promise.resolve()
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(screen.getByText('post')).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('post'))
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(input).toHaveValue('')
        const chips = document.querySelectorAll('[data-filter-chip]')
        expect(chips.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('type chip を再度選択すると上書きされ、type chip は最大 1 つ', async () => {
      await renderAndSettle()

      const input = screen.getByRole('textbox')

      // 1つ目の type chip を追加
      await act(async () => {
        fireEvent.change(input, { target: { value: '@' } })
        await Promise.resolve()
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(screen.getByText('post')).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('post'))
        await Promise.resolve()
      })

      // 2つ目の type chip を追加 (上書き)
      await act(async () => {
        fireEvent.change(input, { target: { value: '@' } })
        await Promise.resolve()
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(screen.getByText('definition')).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('definition'))
        await Promise.resolve()
      })

      await waitFor(() => {
        // type chip は最大 1 つ: post chip は消えて definition chip のみ
        const typeChips = document.querySelectorAll('[data-filter-chip-type="type"]')
        expect(typeChips.length).toBe(1)
        expect(typeChips[0]).toHaveTextContent('definition')
      })
    })
  })

  describe('filter chip 削除', () => {
    it('chip の × ボタンをクリックすると chip が削除される', async () => {
      await renderAndSettle()

      const input = screen.getByRole('textbox')

      // タグ chip を追加
      await act(async () => {
        fireEvent.change(input, { target: { value: '#' } })
        await Promise.resolve()
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(screen.getByText('集合論')).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('集合論'))
        await Promise.resolve()
      })

      await waitFor(() => {
        const chips = document.querySelectorAll('[data-filter-chip]')
        expect(chips.length).toBeGreaterThanOrEqual(1)
      })

      // × ボタンをクリック
      const removeButton = document.querySelector('[data-filter-chip] button')
      expect(removeButton).not.toBeNull()

      await act(async () => {
        fireEvent.click(removeButton!)
        await Promise.resolve()
      })

      await waitFor(() => {
        const chips = document.querySelectorAll('[data-filter-chip]')
        expect(chips.length).toBe(0)
      })
    })
  })

  describe('initialQuery の chip 変換', () => {
    it('initialQuery が "#集合論" のとき、タグ chip が初期表示され input は空', async () => {
      await renderAndSettle({ initialQuery: '#集合論' })

      await waitFor(() => {
        const chip = document.querySelector('[data-filter-chip]')
        expect(chip).not.toBeNull()
        expect(chip?.textContent).toContain('集合論')
      })

      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('')
    })

    it('initialQuery が "@post" のとき、type chip が初期表示され input は空', async () => {
      await renderAndSettle({ initialQuery: '@post' })

      await waitFor(() => {
        const chip = document.querySelector('[data-filter-chip]')
        expect(chip).not.toBeNull()
        expect(chip?.textContent).toContain('post')
      })

      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('')
    })

    it('initialQuery が通常テキストのとき、input に入る', async () => {
      await renderAndSettle({ initialQuery: 'poset' })

      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('poset')
      expect(document.querySelectorAll('[data-filter-chip]').length).toBe(0)
    })

    it('initialQuery が空でも URL の ?q= が input に反映される (静的サイト向け)', async () => {
      window.history.pushState({}, '', '/search?q=poset')
      try {
        await renderAndSettle({ initialQuery: '' })
        const input = screen.getByRole('textbox') as HTMLInputElement
        expect(input.value).toBe('poset')
      } finally {
        window.history.pushState({}, '', '/')
      }
    })
  })

  describe('通常テキスト入力', () => {
    it('`poset` と入力してもドロップダウンが表示されない', async () => {
      await renderAndSettle()

      const input = screen.getByRole('textbox')

      await act(async () => {
        fireEvent.change(input, { target: { value: 'poset' } })
        await Promise.resolve()
        await Promise.resolve()
      })

      // ドロップダウンが表示されない
      expect(document.querySelector('[data-dropdown]')).toBeNull()
      // タグ・type 候補は表示されない
      expect(screen.queryByText('集合論')).not.toBeInTheDocument()
      expect(screen.queryByText('型理論')).not.toBeInTheDocument()
      expect(screen.queryByText('post')).not.toBeInTheDocument()
      expect(screen.queryByText('definition')).not.toBeInTheDocument()
    })
  })
})
