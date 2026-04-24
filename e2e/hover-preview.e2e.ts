import { test, expect } from '@playwright/test'

/**
 * HoverPreview e2e テスト
 *
 * /posts/order-theory ページには [[半順序集合]] と [[束]] の concept-link がある。
 * public/preview-index.json には lattice / poset のエントリがあり、
 * lattice の html 内に data-term="poset" の concept-link が含まれる（子 popup テスト用）。
 */

test.describe('HoverPreview — /posts/order-theory', () => {
  test.beforeEach(async ({ page }) => {
    // preview-index.json の fetch 完了を待ってから各テストを開始する
    const indexResponse = page.waitForResponse(
      (resp) => resp.url().includes('preview-index.json') && resp.status() === 200,
    )
    await page.goto('/posts/order-theory')
    await indexResponse
  })

  test('concept-link にホバーすると .hover-preview popup が表示される', async ({ page }) => {
    const conceptLink = page
      .locator('.concept-link[data-term="poset"]')
      .first()

    await conceptLink.hover()

    const popup = page.locator('.hover-preview').first()
    await expect(popup).toBeVisible()
  })

  test('popup には定義のタイトルが表示される', async ({ page }) => {
    const conceptLink = page
      .locator('.concept-link[data-term="poset"]')
      .first()

    await conceptLink.hover()

    const popup = page.locator('.hover-preview').first()
    await expect(popup.locator('.hover-preview__title')).toContainText('半順序集合')
  })

  test('popup 外にマウスを移動すると popup が閉じる', async ({ page }) => {
    const conceptLink = page
      .locator('.concept-link[data-term="poset"]')
      .first()

    await conceptLink.hover()

    const popup = page.locator('.hover-preview').first()
    await expect(popup).toBeVisible()

    // popup から離れた安全な場所 (h1 など) にマウスを移動
    await page.locator('h1').hover()

    // scheduleClose の 180ms + React 再描画を待つ
    await expect(page.locator('.hover-preview')).toHaveCount(0, { timeout: 1000 })
  })

  test('popup 内の concept-link にホバーすると子 popup が追加表示される（親は残る）', async ({
    page,
  }) => {
    // lattice の popup を開く（lattice の html 内に data-term="poset" の concept-link がある）
    const latticeLink = page
      .locator('.concept-link[data-term="lattice"]')
      .first()

    await latticeLink.hover()

    // 親 popup が表示されるのを待つ
    const parentPopup = page.locator('.hover-preview').first()
    await expect(parentPopup).toBeVisible()

    // 親 popup 内の concept-link (poset) を探す
    const innerLink = page
      .locator('.hover-preview .concept-link[data-term="poset"]')
      .first()

    await expect(innerLink).toBeVisible()
    await innerLink.hover()

    // 子 popup が追加されるのを待つ
    await expect(page.locator('.hover-preview')).toHaveCount(2)

    // 親 popup はまだ表示されている
    await expect(page.locator('.hover-preview').first()).toBeVisible()
  })
})
