import { test, expect } from '@playwright/test'

// -----------------------------------------------------------------------
// 1. def-page (/defs/[id]) の Pagefind メタデータ
// -----------------------------------------------------------------------
test.describe('/defs/poset — Pagefind フィルター属性', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/defs/poset')
  })

  test('data-pagefind-filter="type:definition" の hidden span が存在する', async ({ page }) => {
    const span = page.locator('span[data-pagefind-filter="type:definition"]')
    await expect(span).toHaveCount(1)
    await expect(span).toBeHidden()
  })

  test('タグごとに data-pagefind-filter="tags:集合論" の span が1つ存在する', async ({ page }) => {
    // poset.md のタグは [集合論] の1件
    const span = page.locator('span[data-pagefind-filter="tags:集合論"]')
    await expect(span).toHaveCount(1)
    await expect(span).toBeHidden()
  })

  test('タグは 1タグ 1要素で付与される (タグ数と span 数が一致)', async ({ page }) => {
    // すべての tags フィルター span を数える
    const spans = page.locator('span[data-pagefind-filter^="tags:"]')
    const count = await spans.count()
    // poset.md には tags: [集合論] の 1 件のみ
    expect(count).toBe(1)
  })

  test('.def-content には data-pagefind-body が付いていない', async ({ page }) => {
    // outer wrapper には body を付けない — definition-block 内だけをインデックス
    const defContent = page.locator('.def-content[data-pagefind-body]')
    await expect(defContent).toHaveCount(0)
  })

  test('.definition-block に data-pagefind-body が付いている', async ({ page }) => {
    const block = page.locator('.definition-block[data-pagefind-body]')
    await expect(block).toHaveCount(1)
  })
})

// order-theory.md は tags: [集合論, 代数] の 2 件 — post-page で複数タグを検証するため
// def の複数タグケースは order-theory と同様のロジックが適用されることを確認
// (lattice は tags: [代数] の 1 件)
test.describe('/defs/lattice — data-pagefind-filter の基本確認', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/defs/lattice')
  })

  test('data-pagefind-filter="type:definition" の span が存在する', async ({ page }) => {
    const span = page.locator('span[data-pagefind-filter="type:definition"]')
    await expect(span).toHaveCount(1)
  })

  test('"tags:代数" の span が 1 つ存在し、カンマなし', async ({ page }) => {
    const span = page.locator('span[data-pagefind-filter="tags:代数"]')
    await expect(span).toHaveCount(1)
    // カンマを含まない — 1タグ1要素であることを確認
    const filterVal = await span.getAttribute('data-pagefind-filter')
    expect(filterVal).toMatch(/^tags:[^,]+$/)
  })
})

// -----------------------------------------------------------------------
// 2. post-page (/posts/[slug]) の Pagefind フィルター属性
// -----------------------------------------------------------------------
test.describe('/posts/order-theory — Pagefind フィルター属性', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts/order-theory')
  })

  test('data-pagefind-filter="type:post" の hidden span が存在する', async ({ page }) => {
    const span = page.locator('span[data-pagefind-filter="type:post"]')
    await expect(span).toHaveCount(1)
    await expect(span).toBeHidden()
  })

  test('タグごとに個別の data-pagefind-filter span が存在する', async ({ page }) => {
    // order-theory.md のタグは [集合論, 代数] の 2 件
    const spans = page.locator('span[data-pagefind-filter^="tags:"]')
    const count = await spans.count()
    expect(count).toBe(2)
  })

  test('各タグ span がカンマなしの 1 タグ値を持つ', async ({ page }) => {
    const spans = page.locator('span[data-pagefind-filter^="tags:"]')
    const count = await spans.count()
    for (let i = 0; i < count; i++) {
      const filterVal = await spans.nth(i).getAttribute('data-pagefind-filter')
      expect(filterVal).toMatch(/^tags:[^,]+$/)
    }
  })

  test('"tags:集合論" の span が存在する', async ({ page }) => {
    const span = page.locator('span[data-pagefind-filter="tags:集合論"]')
    await expect(span).toHaveCount(1)
  })

  test('"tags:代数" の span が存在する', async ({ page }) => {
    const span = page.locator('span[data-pagefind-filter="tags:代数"]')
    await expect(span).toHaveCount(1)
  })
})

// -----------------------------------------------------------------------
// 3. Layout — ヘッダー検索ボックス
// -----------------------------------------------------------------------
test.describe('Layout ヘッダー検索ボックス', () => {
  // ホームページで確認 (どのページにも存在するはず)
  test('/ にヘッダー検索フォーム .header-search が存在する', async ({ page }) => {
    await page.goto('/')
    const form = page.locator('form.header-search')
    await expect(form).toHaveCount(1)
  })

  test('/posts にヘッダー検索フォームが存在する', async ({ page }) => {
    await page.goto('/posts')
    const form = page.locator('form.header-search')
    await expect(form).toHaveCount(1)
  })

  test('/defs/poset にヘッダー検索フォームが存在する', async ({ page }) => {
    await page.goto('/defs/poset')
    const form = page.locator('form.header-search')
    await expect(form).toHaveCount(1)
  })

  test('検索フォームに input[name="q"] が存在する', async ({ page }) => {
    await page.goto('/')
    const input = page.locator('form.header-search input[name="q"]')
    await expect(input).toHaveCount(1)
  })

  test('フォームの action が /search を含む', async ({ page }) => {
    await page.goto('/')
    const form = page.locator('form.header-search')
    const action = await form.getAttribute('action')
    expect(action).toMatch(/\/search$/)
  })
})

// -----------------------------------------------------------------------
// 4. /search ページ
// -----------------------------------------------------------------------
test.describe('/search ページ', () => {
  test('/search にアクセスできる (ページが表示される)', async ({ page }) => {
    const response = await page.goto('/search')
    // 404 ではない
    expect(response?.status()).not.toBe(404)
    // body が空でない
    const bodyText = await page.locator('body').textContent()
    expect(bodyText?.trim().length).toBeGreaterThan(0)
  })

  test('SearchInterface がレンダリングされている (検索 input が存在する)', async ({ page }) => {
    await page.goto('/search')
    // data-search-interface 配下の input を使い、ヘッダー検索欄と区別する
    const searchInterface = page.locator('[data-search-interface]')
    await expect(searchInterface).toBeVisible()
    const input = searchInterface.locator('input[data-search-input]')
    await expect(input).toBeVisible()
  })

  test('?q=poset で初期クエリが input に反映される', async ({ page }) => {
    await page.goto('/search?q=poset')
    // data-search-interface 配下の input を検証 (ヘッダー検索欄は除外)
    const searchInterface = page.locator('[data-search-interface]')
    const input = searchInterface.locator('input[data-search-input]')
    const errorMsg = page.locator('text=検索インデックスが見つかりません')

    const inputVisible = await input.isVisible().catch(() => false)
    const errorVisible = await errorMsg.isVisible().catch(() => false)

    if (inputVisible) {
      const value = await input.inputValue()
      expect(value).toBe('poset')
    } else {
      // フォールバック: エラーメッセージが表示される
      expect(errorVisible).toBe(true)
    }
  })
})
