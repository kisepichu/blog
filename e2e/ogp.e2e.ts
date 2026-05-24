import { test, expect } from '@playwright/test'

test.describe('OGP メタタグ', () => {
  test('Post ページに og:image タグがある', async ({ page }) => {
    await page.goto('/posts/diary-2026-04-27')
    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveAttribute('content', /\/ogp\/posts\/diary-2026-04-27\.png$/)
  })

  test('Post ページに og:description タグがある', async ({ page }) => {
    await page.goto('/posts/diary-2026-04-27')
    const ogDesc = page.locator('meta[property="og:description"]')
    const content = await ogDesc.getAttribute('content')
    expect(content).toBeTruthy()
    expect(content!.length).toBeGreaterThan(0)
  })

  test('Post ページに og:site_name = kisen.one がある', async ({ page }) => {
    await page.goto('/posts/diary-2026-04-27')
    const ogSiteName = page.locator('meta[property="og:site_name"]')
    await expect(ogSiteName).toHaveAttribute('content', 'kisen.one')
  })

  test('Post ページに twitter:card タグがある', async ({ page }) => {
    await page.goto('/posts/diary-2026-04-27')
    const twitterCard = page.locator('meta[name="twitter:card"]')
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image')
  })

  test('Definition ページに og:image タグがある', async ({ page }) => {
    await page.goto('/defs/currying')
    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveAttribute('content', /\/ogp\/defs\/currying\.png$/)
  })

  test('Definition ページに og:description タグがある', async ({ page }) => {
    await page.goto('/defs/currying')
    const ogDesc = page.locator('meta[property="og:description"]')
    const content = await ogDesc.getAttribute('content')
    expect(content).toBeTruthy()
    expect(content!.length).toBeGreaterThan(0)
  })

  test('ホームページに og:image タグがない', async ({ page }) => {
    await page.goto('/')
    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveCount(0)
  })

  test('記事一覧ページ (/posts) に og:image タグがない', async ({ page }) => {
    await page.goto('/posts')
    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveCount(0)
  })
})

test.describe('OGP 画像ファイル', () => {
  test('Post OGP 画像が PNG として返る', async ({ request }) => {
    const response = await request.get('/ogp/posts/diary-2026-04-27.png')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('image/png')
    const body = await response.body()
    // PNG シグネチャ: 89 50 4E 47
    expect(body[0]).toBe(0x89)
    expect(body[1]).toBe(0x50)
    expect(body[2]).toBe(0x4e)
    expect(body[3]).toBe(0x47)
  })

  test('Definition OGP 画像が PNG として返る', async ({ request }) => {
    const response = await request.get('/ogp/defs/currying.png')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('image/png')
    const body = await response.body()
    expect(body[0]).toBe(0x89)
    expect(body[1]).toBe(0x50)
    expect(body[2]).toBe(0x4e)
    expect(body[3]).toBe(0x47)
  })
})
