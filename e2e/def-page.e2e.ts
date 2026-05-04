import { test, expect } from '@playwright/test'

test.describe('/defs/poset ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/defs/poset')
  })

  test('ページタイトル「半順序集合」が表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/半順序集合/)
  })

  test('パンくずリストが "Home › Defs › 半順序集合" の順で表示される', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="パンくずリスト"]')
    await expect(breadcrumb).toBeVisible()

    const items = breadcrumb.locator('a, span')
    await expect(items.nth(0)).toHaveText('Home')
    await expect(items.nth(1)).toHaveText('›')
    await expect(items.nth(2)).toHaveText('Defs')
    await expect(items.nth(3)).toHaveText('›')
    await expect(items.nth(4)).toHaveText('半順序集合')
  })

  test('definition-block が表示される (.definition-block 要素が存在する)', async ({ page }) => {
    const block = page.locator('.definition-block')
    await expect(block).toBeVisible()
  })

  test('▶ 定義 (タイトル) ラベルが CSS ::before 擬似要素で表示される', async ({ page }) => {
    const block = page.locator('.definition-block')
    await expect(block).toBeVisible()

    // CSS ::before の content を page.evaluate で取得する
    const beforeContent = await page.evaluate(() => {
      const el = document.querySelector('.definition-block')
      if (!el) return null
      return window.getComputedStyle(el, '::before').content
    })

    // content は CSS 文字列として返るので引用符付き '▶ 定義 (タイトル)' を期待
    expect(beforeContent).toBe('"▶ 定義 (半順序集合)"')
  })

  test('タグバッジ #集合論 が色付きで表示される', async ({ page }) => {
    const tag = page.locator('.tag', { hasText: '#集合論' })
    await expect(tag).toBeVisible()

    // 色付き = inline style の background が設定されている
    const style = await tag.getAttribute('style')
    expect(style).toMatch(/background/)
  })

  test('<h1> に「半順序集合」が含まれる', async ({ page }) => {
    const h1 = page.locator('.def-title')
    await expect(h1).toContainText('半順序集合')
  })

  test('def-header に id-badge「poset」が表示される', async ({ page }) => {
    const idBadge = page.locator('.def-id-badge')
    await expect(idBadge).toBeVisible()
    await expect(idBadge).toHaveText('poset')
  })

  test('def-header に英語名「partially ordered set」が表示される', async ({ page }) => {
    const english = page.locator('.def-english')
    await expect(english).toBeVisible()
    await expect(english).toContainText('partially ordered set')
  })

  test('バックリンクがある場合 .backlinks セクションが表示される', async ({ page }) => {
    // lattice.md が [[poset]] を参照しているため、バックリンクが表示される
    const backlinks = page.locator('.backlinks')
    await expect(backlinks).toBeVisible()
    const items = backlinks.locator('.backlink-item')
    // 「束」へのリンクが含まれている
    const count = await items.count()
    expect(count).toBeGreaterThanOrEqual(1)
    const texts = await backlinks.innerText()
    expect(texts).toContain('束')
  })
})
