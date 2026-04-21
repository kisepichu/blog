import { test, expect } from '@playwright/test'

test.describe('/tags/集合論 ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tags/集合論')
  })

  test('ページが表示される (h1 が見える)', async ({ page }) => {
    const h1 = page.locator('h1.tag-title')
    await expect(h1).toBeVisible()
  })

  test('Breadcrumb が "Home › Tags › 集合論" の順で表示される', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="パンくずリスト"]')
    await expect(breadcrumb).toBeVisible()

    const items = breadcrumb.locator('a, span')
    await expect(items.nth(0)).toHaveText('Home')
    await expect(items.nth(1)).toHaveText('›')
    await expect(items.nth(2)).toHaveText('Tags')
    await expect(items.nth(3)).toHaveText('›')
    await expect(items.nth(4)).toHaveText('集合論')
  })

  test('Breadcrumb の "Tags" は <span> (リンクなし)', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="パンくずリスト"]')
    const tagsSpan = breadcrumb.locator('span', { hasText: 'Tags' })
    await expect(tagsSpan).toBeVisible()

    // <a> タグではないことを確認
    const tagsLink = breadcrumb.locator('a', { hasText: 'Tags' })
    await expect(tagsLink).toHaveCount(0)
  })

  test('Breadcrumb の "集合論" は <span> (リンクなし)', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="パンくずリスト"]')
    const tagSpan = breadcrumb.locator('span', { hasText: '集合論' })
    await expect(tagSpan).toBeVisible()

    // <a> タグではないことを確認
    const tagLink = breadcrumb.locator('a', { hasText: '集合論' })
    await expect(tagLink).toHaveCount(0)
  })

  test('h1.tag-title に .tag (TagBadge) が含まれる', async ({ page }) => {
    const h1 = page.locator('h1.tag-title')
    const tagBadge = h1.locator('.tag')
    await expect(tagBadge).toBeVisible()
  })

  test('h1.tag-title に "集合論" テキストが含まれる', async ({ page }) => {
    const h1 = page.locator('h1.tag-title')
    await expect(h1).toContainText('集合論')
  })

  test('記事セクション .section-title に "記事" が表示される', async ({ page }) => {
    const sectionTitles = page.locator('.section-title')
    const articleSection = sectionTitles.filter({ hasText: '記事' })
    await expect(articleSection).toBeVisible()
  })

  test('.post-card が1件以上表示される', async ({ page }) => {
    const postCards = page.locator('.post-card')
    const count = await postCards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('post-card が /posts/order-theory へのリンクになっている', async ({ page }) => {
    const postCard = page.locator('a.post-card[href="/posts/order-theory"]')
    await expect(postCard).toBeVisible()
  })

  test('post-card に date "2025-03-22" が表示される', async ({ page }) => {
    const date = page.locator('.post-card__date')
    await expect(date.first()).toBeVisible()
    await expect(date.first()).toContainText('2025-03-22')
  })

  test('定義セクション .section-title に "定義" が表示される', async ({ page }) => {
    const sectionTitles = page.locator('.section-title')
    const defSection = sectionTitles.filter({ hasText: '定義' })
    await expect(defSection).toBeVisible()
  })

  test('.def-compact-item が1件以上表示される', async ({ page }) => {
    const defItems = page.locator('.def-compact-item')
    const count = await defItems.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('def-compact-item が /defs/poset へのリンクになっている', async ({ page }) => {
    const defItem = page.locator('a.def-compact-item[href="/defs/poset"]')
    await expect(defItem).toBeVisible()
  })
})

test.describe('/tags/代数 ページ (defs あり、posts あり)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tags/代数')
  })

  test('.def-compact-item が1件以上表示される (lattice)', async ({ page }) => {
    const defItems = page.locator('.def-compact-item')
    const count = await defItems.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('.post-card が1件以上表示される (order-theory)', async ({ page }) => {
    const postCards = page.locator('.post-card')
    const count = await postCards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

test.describe('存在しないタグ', () => {
  test('/tags/存在しないタグ → 404 ページが表示される', async ({ page }) => {
    const response = await page.goto('/tags/存在しないタグ')
    expect(response?.status()).toBe(404)
  })
})
