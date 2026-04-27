import { test, expect } from '@playwright/test'

test.describe('/posts/order-theory ページ giscus コメント欄', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts/order-theory')
  })

  test('.giscus-wrapper が存在する', async ({ page }) => {
    const wrapper = page.locator('.giscus-wrapper')
    await expect(wrapper).toBeAttached()
  })

  test('giscus script タグが data-repo="kisepichu/blog" を持つ', async ({ page }) => {
    const script = page.locator('script[src*="giscus.app/client.js"]')
    await expect(script).toHaveAttribute('data-repo', 'kisepichu/blog')
  })

  test('giscus script タグが data-mapping="pathname" を持つ', async ({ page }) => {
    const script = page.locator('script[src*="giscus.app/client.js"]')
    await expect(script).toHaveAttribute('data-mapping', 'pathname')
  })
})

test.describe('/defs/poset ページ giscus コメント欄', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/defs/poset')
  })

  test('.giscus-wrapper が存在する', async ({ page }) => {
    const wrapper = page.locator('.giscus-wrapper')
    await expect(wrapper).toBeAttached()
  })

  test('giscus script タグが data-repo="kisepichu/blog" を持つ', async ({ page }) => {
    const script = page.locator('script[src*="giscus.app/client.js"]')
    await expect(script).toHaveAttribute('data-repo', 'kisepichu/blog')
  })
})
