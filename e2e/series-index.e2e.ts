import { test, expect } from '@playwright/test'

test.describe('/series (シリーズ一覧ページ)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/series')
  })

  // --- ページ基本表示 ---

  test('h1.series-index__heading が表示される', async ({ page }) => {
    const h1 = page.locator('h1.series-index__heading')
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('シリーズ')
  })

  test('Breadcrumb が "Home › Series" の形式で表示される', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="パンくずリスト"]')
    await expect(breadcrumb).toBeVisible()

    const items = breadcrumb.locator('a, span')
    await expect(items.nth(0)).toHaveText('Home')
    await expect(items.nth(1)).toHaveText('›')
    await expect(items.nth(2)).toHaveText('Series')
  })

  // --- series セクション ---

  test('.series-index__section が1件以上表示される', async ({ page }) => {
    const sections = page.locator('.series-index__section')
    const count = await sections.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('e2e フィクスチャ "テストシリーズ" のセクションが表示される', async ({ page }) => {
    const sections = page.locator('.series-index__section')
    const testSection = sections.filter({ hasText: 'テストシリーズ' })
    await expect(testSection).toBeVisible()
  })

  test('e2e フィクスチャ "テストシリーズ" の h2 が /series/test-series へのリンクになっている', async ({
    page,
  }) => {
    const titleLink = page.locator('a[href="/series/test-series"]')
    await expect(titleLink).toBeVisible()
    await expect(titleLink).toContainText('テストシリーズ')
  })

  test('description が表示される', async ({ page }) => {
    await expect(page.locator('body')).toContainText('e2e テスト用のシリーズフィクスチャ')
  })

  // --- 記事リスト ---

  test('.series-post-list が表示される', async ({ page }) => {
    const list = page.locator('.series-post-list').first()
    await expect(list).toBeVisible()
  })

  test('記事リストが series_order 昇順で表示される（最初の番号が "01"）', async ({ page }) => {
    const firstNum = page.locator('.series-post-num').first()
    await expect(firstNum).toContainText('01')
  })

  test('.series-post-item が1件以上表示される', async ({ page }) => {
    const items = page.locator('.series-post-item')
    const count = await items.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('ローカル: draft 記事に .upcoming-badge が表示される', async ({ page }) => {
    const badge = page.locator('.upcoming-badge').first()
    await expect(badge).toBeVisible()
  })

  // --- nav ---

  test('ヘッダーに "series" リンクが表示される', async ({ page }) => {
    const nav = page.locator('.site-nav')
    const seriesLink = nav.locator('a', { hasText: 'series' })
    await expect(seriesLink).toBeVisible()
  })

  test('/series 訪問時に "series" リンクが .active クラスを持つ', async ({ page }) => {
    const nav = page.locator('.site-nav')
    const seriesLink = nav.locator('a.active', { hasText: 'series' })
    await expect(seriesLink).toBeVisible()
  })
})
