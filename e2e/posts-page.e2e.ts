import { test, expect } from '@playwright/test'

test.describe('/posts 記事一覧ページ 基本表示', () => {
  let response: Awaited<ReturnType<typeof page.goto>>

  test.beforeEach(async ({ page }) => {
    response = await page.goto('/posts')
  })

  test('/posts にアクセスして何か visible になる (HTTP 200)', async ({ page }) => {
    expect(response?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
  })

  test('.post-card が1件以上表示される', async ({ page }) => {
    const postCards = page.locator('.post-card')
    const count = await postCards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('.post-card が最大10件表示される', async ({ page }) => {
    const postCards = page.locator('.post-card')
    const count = await postCards.count()
    expect(count).toBeLessThanOrEqual(10)
  })

  test('Breadcrumb が "Home › Posts" の形式で表示される', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="パンくずリスト"]')
    await expect(breadcrumb).toBeVisible()

    const items = breadcrumb.locator('a, span')
    await expect(items.nth(0)).toHaveText('Home')
    await expect(items.nth(1)).toHaveText('›')
    await expect(items.nth(2)).toHaveText('Posts')
  })

  test('Breadcrumb の "Posts" が <span> (リンクなし)', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="パンくずリスト"]')
    const postsSpan = breadcrumb.locator('span', { hasText: 'Posts' })
    await expect(postsSpan).toBeVisible()

    // <a> タグではないことを確認
    const postsLink = breadcrumb.locator('a', { hasText: 'Posts' })
    await expect(postsLink).toHaveCount(0)
  })

  test('nav の "posts" リンクに .active クラスまたは aria-current="page" がある', async ({
    page,
  }) => {
    const navPostsActive = page.locator('nav a[href="/posts"].active, nav a[href="/posts"][aria-current="page"]')
    await expect(navPostsActive).toBeVisible()
  })

  test('[data-pagefind-ignore] 属性がページに存在する', async ({ page }) => {
    const pagefindIgnore = page.locator('[data-pagefind-ignore]')
    const count = await pagefindIgnore.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

test.describe('/posts post-card の内容', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts')
  })

  test('post-card が /posts/test-home-extra-1 へのリンクになっている', async ({ page }) => {
    const postCard = page.locator('a.post-card[href="/posts/test-home-extra-1"]')
    await expect(postCard).toBeVisible()
  })

  test('test-home-extra-1 のカードに date "2099-06-01" が表示される', async ({ page }) => {
    const postCard = page.locator('a.post-card[href="/posts/test-home-extra-1"]')
    const date = postCard.locator('.post-card__date')
    await expect(date).toBeVisible()
    await expect(date).toContainText('2099-06-01')
  })

  test('test-home-extra-1 のカードに tags が表示される (.post-card__tags .tag が1件以上)', async ({
    page,
  }) => {
    const postCard = page.locator('a.post-card[href="/posts/test-home-extra-1"]')
    const tagBadges = postCard.locator('.post-card__tags .tag')
    const count = await tagBadges.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('series なし記事 (test-home-extra-1) に .post-card__series が表示されない', async ({
    page,
  }) => {
    const postCard = page.locator('a.post-card[href="/posts/test-home-extra-1"]')
    const seriesInfo = postCard.locator('.post-card__series')
    await expect(seriesInfo).toHaveCount(0)
  })

  test('series あり記事 (test-home-series) に .post-card__series が表示される', async ({ page }) => {
    const postCard = page.locator('a.post-card[href="/posts/test-home-series"]')
    const seriesInfo = postCard.locator('.post-card__series')
    await expect(seriesInfo).toBeVisible()
  })
})

test.describe('/posts ページネーション (11件以上存在する前提)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts')
  })

  test('.posts-pagination が表示される', async ({ page }) => {
    const pagination = page.locator('.posts-pagination')
    await expect(pagination).toBeVisible()
  })

  test('1ページ目の prev ボタンが disabled (.posts-pagination__btn--disabled または <span>)', async ({
    page,
  }) => {
    const pagination = page.locator('.posts-pagination')
    // disabled な prev は span か .posts-pagination__btn--disabled
    // disabled クラスが付いた prev ボタンが存在することを確認
    const disabledBtnCount = await pagination.locator('.posts-pagination__btn--disabled').count()
    expect(disabledBtnCount).toBeGreaterThanOrEqual(1)
  })

  test('1ページ目の next ボタンが /posts/page/2 へのリンクである', async ({ page }) => {
    const nextLink = page.locator('a[href="/posts/page/2"]')
    await expect(nextLink).toBeVisible()
  })
})

test.describe('/posts/page/2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts/page/2')
  })

  test('.post-card が1件以上表示される', async ({ page }) => {
    const postCards = page.locator('.post-card')
    const count = await postCards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('Breadcrumb が "Home › Posts" の形式で表示される', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="パンくずリスト"]')
    await expect(breadcrumb).toBeVisible()

    const items = breadcrumb.locator('a, span')
    await expect(items.nth(0)).toHaveText('Home')
    await expect(items.nth(1)).toHaveText('›')
    await expect(items.nth(2)).toHaveText('Posts')
  })
})

test.describe('存在しないページ', () => {
  test('/posts/page/1 にアクセスすると 404', async ({ page }) => {
    const response = await page.goto('/posts/page/1')
    expect(response?.status()).toBe(404)
  })
})
