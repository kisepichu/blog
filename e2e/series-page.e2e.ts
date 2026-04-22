import { test, expect } from '@playwright/test'

test.describe('/series/test-series ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/series/test-series')
  })

  test('h1 に "テストシリーズ" が表示される', async ({ page }) => {
    const h1 = page.locator('h1')
    await expect(h1).toContainText('テストシリーズ')
  })

  test('description が表示される', async ({ page }) => {
    // description テキストが見える
    await expect(page.locator('body')).toContainText('e2e テスト用のシリーズフィクスチャ')
  })

  test('.series-post-list が表示される', async ({ page }) => {
    const list = page.locator('.series-post-list')
    await expect(list).toBeVisible()
  })

  test('Breadcrumb が "Home › Series › テストシリーズ" の形式で表示される', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="パンくずリスト"]')
    await expect(breadcrumb).toBeVisible()

    const items = breadcrumb.locator('a, span')
    await expect(items.nth(0)).toHaveText('Home')
    await expect(items.nth(1)).toHaveText('›')
    await expect(items.nth(2)).toHaveText('Series')
    await expect(items.nth(3)).toHaveText('›')
    await expect(items.nth(4)).toHaveText('テストシリーズ')
  })

  test('Breadcrumb の "Series" はリンクではなく plain text (<span>) である', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="パンくずリスト"]')
    const seriesSpan = breadcrumb.locator('span', { hasText: 'Series' })
    await expect(seriesSpan).toBeVisible()

    // <a> タグではないことを確認
    const seriesLink = breadcrumb.locator('a', { hasText: 'Series' })
    await expect(seriesLink).toHaveCount(0)
  })

  test('記事リストが series_order 昇順で表示される（最初の番号が "01"）', async ({ page }) => {
    const firstNum = page.locator('.series-post-num').first()
    await expect(firstNum).toHaveText('01')
  })

  test('.series-post-item が1件以上表示される', async ({ page }) => {
    const items = page.locator('.series-post-item')
    const count = await items.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('draft 記事に .upcoming-badge が表示される（ローカル dev モード）', async ({ page }) => {
    // ローカル dev モードでは draft 記事も表示され "準備中" バッジが付く
    // 複数の draft 記事がある場合も想定して .first() を使用
    const badge = page.locator('.upcoming-badge').first()
    await expect(badge).toBeVisible()
  })

  test('draft 記事は .series-post-item--draft クラスを持ち、<a> ではなく <span> 等でレンダリングされる', async ({
    page,
  }) => {
    // draft アイテムが存在する
    const draftItem = page.locator('.series-post-item--draft').first()
    await expect(draftItem).toBeVisible()

    // draft アイテム自体または直接の親に href 属性がない（クリック不可）
    // <a> タグではなく <span> や <div> としてレンダリングされているはず
    const draftLink = page.locator('.series-post-item--draft a[href]')
    await expect(draftLink).toHaveCount(0)
  })
})

test.describe('/posts/test-series-post ページ の series-nav', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts/test-series-post')
  })

  test('.series-nav が表示される', async ({ page }) => {
    const nav = page.locator('.series-nav')
    await expect(nav).toBeVisible()
  })

  test('series 先頭記事 (series_order:1) は .series-nav__btn--prev が表示されない', async ({
    page,
  }) => {
    const prevBtn = page.locator('.series-nav__btn--prev')
    await expect(prevBtn).toHaveCount(0)
  })
})

test.describe('/posts/order-theory ページ の series-nav（series なし）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts/order-theory')
  })

  test('series なし post に .series-nav が表示されない', async ({ page }) => {
    const nav = page.locator('.series-nav')
    await expect(nav).toHaveCount(0)
  })
})

test.describe('/ (ホームページ) の series-card タイトル', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('series-card にスラグでなくシリーズタイトルが表示される', async ({ page }) => {
    const seriesCard = page.locator('.series-card[href="/series/test-series"]')
    await expect(seriesCard).toBeVisible()
    await expect(seriesCard).toContainText('テストシリーズ')
  })
})

test.describe('/posts/test-series-post ページ の series-banner タイトル', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts/test-series-post')
  })

  test('series-banner のリンクテキストがスラグでなくシリーズタイトルになっている', async ({
    page,
  }) => {
    const bannerLink = page.locator('.series-banner a')
    await expect(bannerLink).toContainText('テストシリーズ')
  })
})
