import { test, expect } from '@playwright/test'

test.describe('/posts/order-theory ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts/order-theory')
  })

  test('h1 に記事タイトルが表示される', async ({ page }) => {
    const h1 = page.locator('h1.post-title')
    await expect(h1).toContainText('日記：半順序と束について')
  })

  test('パンくずリストが "Home › Posts › タイトル" の順で表示される', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="パンくずリスト"]')
    await expect(breadcrumb).toBeVisible()

    const items = breadcrumb.locator('a, span')
    await expect(items.nth(0)).toHaveText('Home')
    await expect(items.nth(1)).toHaveText('›')
    await expect(items.nth(2)).toHaveText('Posts')
    await expect(items.nth(3)).toHaveText('›')
    await expect(items.nth(4)).toHaveText('日記：半順序と束について')
  })

  test('パンくずリストの "Posts" が /posts へのリンクである', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="パンくずリスト"]')
    const postsLink = breadcrumb.locator('a', { hasText: 'Posts' })
    await expect(postsLink).toBeVisible()
    await expect(postsLink).toHaveAttribute('href', '/posts')
  })

  test('series なし → .series-banner が表示されない', async ({ page }) => {
    const banner = page.locator('.series-banner')
    await expect(banner).toHaveCount(0)
  })

  test('タグバッジ #集合論 が表示される', async ({ page }) => {
    const tag = page.locator('.tag', { hasText: '#集合論' })
    await expect(tag).toBeVisible()
  })

  test('[[半順序集合]] が .concept-link としてレンダリングされる', async ({ page }) => {
    const conceptLink = page.locator('.concept-link[data-term="poset"]').first()
    await expect(conceptLink).toBeVisible()
    await expect(conceptLink).toHaveText('半順序集合(partially ordered set)')
  })

  test('::embed[poset] で .definition-block が1つ以上表示される', async ({ page }) => {
    const blocks = page.locator('.definition-block')
    await expect(blocks.first()).toBeVisible()
    const count = await blocks.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('date 2025-03-22 が表示される', async ({ page }) => {
    const date = page.locator('.post-date')
    await expect(date).toBeVisible()
    await expect(date).toContainText('2025')
  })
})

test.describe('/posts/test-series-post ページ (シリーズあり)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts/test-series-post')
  })

  test('.series-banner が表示される', async ({ page }) => {
    const banner = page.locator('.series-banner')
    await expect(banner).toBeVisible()
  })

  test('series-banner に /series/test-series へのリンクがある', async ({ page }) => {
    const banner = page.locator('.series-banner')
    const link = banner.locator('a[href="/series/test-series"]')
    await expect(link).toBeVisible()
  })

  test('series-banner に #1 が表示される', async ({ page }) => {
    const banner = page.locator('.series-banner')
    await expect(banner).toContainText('#1')
  })

  test('date 2025-01-01 が表示される', async ({ page }) => {
    const date = page.locator('.post-date')
    await expect(date).toBeVisible()
    await expect(date).toContainText('2025')
  })
})
