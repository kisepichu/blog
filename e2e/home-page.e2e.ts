import { test, expect } from '@playwright/test'

test.describe('/ (ホームページ)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  // --- hero セクション ---

  test('hero セクションが表示される', async ({ page }) => {
    const hero = page.locator('.home-hero__prompt')
    await expect(hero).toBeVisible()
    await expect(hero).toContainText('~/blog $ ls')
  })

  test('h1.home-title に "きせのブログ" が表示される', async ({ page }) => {
    const h1 = page.locator('h1.home-title')
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('きせのブログ')
  })

  test('p.home-subtitle に "型理論" が含まれる', async ({ page }) => {
    const subtitle = page.locator('p.home-subtitle')
    await expect(subtitle).toBeVisible()
    await expect(subtitle).toContainText('型理論')
  })

  // --- 2カラムグリッド ---

  test('.home-grid が表示される', async ({ page }) => {
    const grid = page.locator('.home-grid')
    await expect(grid).toBeVisible()
  })

  // --- 最新記事セクション ---

  test('"最新記事" セクションタイトルが表示される', async ({ page }) => {
    const sectionTitles = page.locator('.section-title')
    const latestSection = sectionTitles.filter({ hasText: '最新記事' })
    await expect(latestSection).toBeVisible()
  })

  test('.post-card が1件以上表示される', async ({ page }) => {
    const postCards = page.locator('.post-card')
    const count = await postCards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('.post-card は最大5件まで表示される', async ({ page }) => {
    const postCards = page.locator('.post-card')
    const count = await postCards.count()
    expect(count).toBeLessThanOrEqual(5)
  })

  test('order-theory の post-card が /posts/order-theory へのリンクになっている', async ({
    page,
  }) => {
    const postCard = page.locator('a.post-card[href="/posts/order-theory"]')
    await expect(postCard).toBeVisible()
  })

  test('order-theory の post-card に date "2025-03-22" が表示される', async ({ page }) => {
    const postCard = page.locator('a.post-card[href="/posts/order-theory"]')
    const date = postCard.locator('.post-card__date')
    await expect(date).toBeVisible()
    await expect(date).toContainText('2025-03-22')
  })

  test('order-theory の post-card にタグバッジが表示される', async ({ page }) => {
    const postCard = page.locator('a.post-card[href="/posts/order-theory"]')
    const tags = postCard.locator('.post-card__tags')
    await expect(tags).toBeVisible()
    const tagBadges = tags.locator('.tag')
    const count = await tagBadges.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('order-theory の post-card に "集合論" タグが含まれる', async ({ page }) => {
    const postCard = page.locator('a.post-card[href="/posts/order-theory"]')
    const tagBadge = postCard.locator('.tag', { hasText: '集合論' })
    await expect(tagBadge).toBeVisible()
  })

  test('series なし post-card に .post-card__series が表示されない', async ({ page }) => {
    const postCard = page.locator('a.post-card[href="/posts/order-theory"]')
    const seriesInfo = postCard.locator('.post-card__series')
    await expect(seriesInfo).toHaveCount(0)
  })

  test('test-series-post の post-card に .post-card__series が表示される', async ({ page }) => {
    const postCard = page.locator('a.post-card[href="/posts/test-series-post"]')
    const seriesInfo = postCard.locator('.post-card__series')
    await expect(seriesInfo).toBeVisible()
  })

  // --- "すべての記事を見る" リンク ---
  // dev content: 6件 (order-theory + test-posts-only-tag + test-series-post + test-home-extra-{1,2,3})
  // posts.length (6) > 5 → view-all が表示される

  test('"すべての記事を見る" リンクが表示される (記事が6件以上)', async ({ page }) => {
    const viewAll = page.locator('a.view-all')
    await expect(viewAll).toBeVisible()
  })

  test('"すべての記事を見る" リンクが /posts へのリンクになっている', async ({ page }) => {
    const viewAll = page.locator('a.view-all')
    await expect(viewAll).toHaveAttribute('href', '/posts')
  })

  // --- aside: シリーズ ---

  test('"シリーズ" セクションタイトルが表示される', async ({ page }) => {
    const sectionTitles = page.locator('.section-title')
    const seriesSection = sectionTitles.filter({ hasText: 'シリーズ' })
    await expect(seriesSection).toBeVisible()
  })

  test('.series-card が /series/test-series へのリンクになっている', async ({ page }) => {
    const seriesCard = page.locator('a.series-card[href="/series/test-series"]')
    await expect(seriesCard).toBeVisible()
  })

  test('.series-card にシリーズタイトルと記事数が表示される', async ({ page }) => {
    const seriesCard = page.locator('a.series-card[href="/series/test-series"]')
    await expect(seriesCard).toBeVisible()
    // タイトルテキストが存在する
    const text = await seriesCard.textContent()
    expect(text).toBeTruthy()
    expect(text!.length).toBeGreaterThan(0)
  })

  // --- aside: 最近の定義 ---

  test('"最近の定義" セクションタイトルが表示される', async ({ page }) => {
    const sectionTitles = page.locator('.section-title')
    const defsSection = sectionTitles.filter({ hasText: '最近の定義' })
    await expect(defsSection).toBeVisible()
  })

  test('.def-compact-item が1件以上表示される', async ({ page }) => {
    const defItems = page.locator('.def-compact-item')
    const count = await defItems.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('.def-compact-item は最大4件まで表示される', async ({ page }) => {
    const defItems = page.locator('.def-compact-item')
    const count = await defItems.count()
    expect(count).toBeLessThanOrEqual(4)
  })

  test('poset の def-compact-item が /defs/poset へのリンクになっている', async ({ page }) => {
    const defItem = page.locator('a.def-compact-item[href="/defs/poset"]')
    await expect(defItem).toBeVisible()
  })

  test('lattice の def-compact-item が /defs/lattice へのリンクになっている', async ({ page }) => {
    const defItem = page.locator('a.def-compact-item[href="/defs/lattice"]')
    await expect(defItem).toBeVisible()
  })

  // --- aside: タグ一覧 ---

  test('"タグ" セクションタイトルが表示される', async ({ page }) => {
    const sectionTitles = page.locator('.section-title')
    const tagsSection = sectionTitles.filter({ hasText: 'タグ' })
    await expect(tagsSection).toBeVisible()
  })

  test('.tag バッジが1件以上表示される', async ({ page }) => {
    // asideのタグ一覧
    const aside = page.locator('aside')
    const tagBadges = aside.locator('.tag')
    const count = await tagBadges.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('"集合論" タグが /tags/集合論 へのリンクになっている', async ({ page }) => {
    const aside = page.locator('aside')
    const tagLink = aside.locator('a.tag[href="/tags/集合論"]')
    await expect(tagLink).toBeVisible()
  })

  // --- Pagefind ---

  test('[data-pagefind-ignore] 属性でページコンテンツが囲まれている', async ({ page }) => {
    const pagefindIgnore = page.locator('[data-pagefind-ignore]')
    const count = await pagefindIgnore.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})
