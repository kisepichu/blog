import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import React from 'react'

import HeaderSearch from '../HeaderSearch'

const mockFilters = vi.fn().mockResolvedValue({
  tags: { '集合論': 3, '型理論': 5 },
  type: { post: 4, definition: 10 },
})
const mockInit = vi.fn().mockResolvedValue(undefined)

vi.mock('/test-base/pagefind/pagefind.js', () => ({
  default: {
    init: mockInit,
    filters: mockFilters,
  },
  init: mockInit,
  filters: mockFilters,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockFilters.mockResolvedValue({
    tags: { '集合論': 3, '型理論': 5 },
    type: { post: 4, definition: 10 },
  })
  mockInit.mockResolvedValue(undefined)
})

afterEach(async () => {
  await act(async () => { cleanup() })
  vi.restoreAllMocks()
})

async function renderAndSettle() {
  let result: ReturnType<typeof render> | undefined
  await act(async () => {
    result = render(<HeaderSearch baseUrl="/test-base/" />)
  })
  return result!
}

// ── URL ?q= 初期値 ──────────────────────────────────────────────────

describe('URL ?q= からの初期値', () => {
  it('マウント時に ?q= の値を入力欄に反映する', async () => {
    window.history.pushState({}, '', '?q=poset')
    await renderAndSettle()
    const input = screen.getByRole('combobox')
    expect(input).toHaveValue('poset')
    window.history.pushState({}, '', '/')
  })
})

// ── タグ補完ドロップダウン ────────────────────────────────────────────

describe('タグ補完', () => {
  it('# 入力でタグ一覧が表示される', async () => {
    await renderAndSettle()
    const input = screen.getByRole('combobox')

    await act(async () => {
      fireEvent.change(input, { target: { value: '#' } })
    })

    // Pagefind init が非同期なので filters() 完了を待つ
    await act(async () => {})

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('集合論')).toBeInTheDocument()
    expect(screen.getByText('型理論')).toBeInTheDocument()
  })

  it('# の後に文字を入れると絞り込まれる', async () => {
    await renderAndSettle()
    const input = screen.getByRole('combobox')

    await act(async () => {
      fireEvent.change(input, { target: { value: '#集合' } })
    })
    await act(async () => {})

    expect(screen.getByText('集合論')).toBeInTheDocument()
    expect(screen.queryByText('型理論')).not.toBeInTheDocument()
  })

  it('@ 入力でタイプ一覧が表示される', async () => {
    await renderAndSettle()
    const input = screen.getByRole('combobox')

    await act(async () => {
      fireEvent.change(input, { target: { value: '@' } })
    })
    await act(async () => {})

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('post')).toBeInTheDocument()
    expect(screen.getByText('definition')).toBeInTheDocument()
  })

  it('タグ候補クリックで input に挿入されドロップダウンが閉じる', async () => {
    await renderAndSettle()
    const input = screen.getByRole('combobox')

    await act(async () => {
      fireEvent.change(input, { target: { value: '#' } })
    })
    await act(async () => {})

    const item = screen.getByText('集合論')
    await act(async () => { fireEvent.click(item) })

    expect(input).toHaveValue('#集合論')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('検索語の後に # でインラインプレフィックス付きで input に挿入される', async () => {
    await renderAndSettle()
    const input = screen.getByRole('combobox')

    await act(async () => {
      fireEvent.change(input, { target: { value: 'poset #' } })
    })
    await act(async () => {})

    const item = screen.getByText('集合論')
    await act(async () => { fireEvent.click(item) })

    expect(input).toHaveValue('poset #集合論')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ── Enter キー送信 ────────────────────────────────────────────────────

describe('Enter キー', () => {
  it('Enter で search ページに遷移する', async () => {
    let navigatedTo = ''
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      value: { ...window.location, set href(v: string) { navigatedTo = v } },
      writable: true, configurable: true,
    })

    try {
      await renderAndSettle()
      const input = screen.getByRole('combobox')

      await act(async () => {
        fireEvent.change(input, { target: { value: 'poset' } })
      })
      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter' })
      })

      expect(navigatedTo).toContain('search')
      expect(decodeURIComponent(navigatedTo)).toContain('poset')
    } finally {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true, configurable: true,
      })
    }
  })
})

// ── ArrowDown / ArrowUp ────────────────────────────────────────────────

describe('Arrow キーナビゲーション', () => {
  it('ArrowDown でハイライトが移動し Enter で input に挿入される', async () => {
    await renderAndSettle()
    const input = screen.getByRole('combobox')

    await act(async () => {
      fireEvent.change(input, { target: { value: '#' } })
    })
    await act(async () => {})

    await act(async () => {
      fireEvent.keyDown(input, { key: 'ArrowDown' })
    })

    // 1 つ目の候補がアクティブになる
    const items = screen.getAllByRole('option')
    expect(items[0]).toHaveAttribute('aria-selected', 'true')
    const firstLabel = items[0].textContent ?? ''

    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    expect(input).toHaveValue(`#${firstLabel}`)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('Escape でドロップダウンが閉じる', async () => {
    await renderAndSettle()
    const input = screen.getByRole('combobox')

    await act(async () => {
      fireEvent.change(input, { target: { value: '#' } })
    })
    await act(async () => {})

    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await act(async () => {
      fireEvent.keyDown(input, { key: 'Escape' })
    })

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
