# TASK-019: OGP 対応 (issue #53)

## 参照仕様

- docs/features/ogp.md
- docs/spec.md § OGP

## チェックリスト

### 0. 準備

- [x] `pnpm add satori @resvg/resvg-js` でパッケージを追加
- [x] フォントファイルを取得して `src/assets/fonts/` に配置
  - `DotGothic16-Regular.ttf` (Google Fonts から curl で取得)
  - `MPLUSRounded1c-Regular.ttf` (Google Fonts から curl で取得)

### 1. スキーマ変更

- [x] `src/content.config.ts`: Post に `description: z.string().optional()` を追加
- [x] `pnpm astro check` で型エラーがないことを確認

### 2. description 抽出ユーティリティ (TDD)

- [x] テストを先に書く: `src/lib/build/extract-description.test.ts` (7ケース)
- [x] `src/lib/build/extract-description.ts` を実装
- [x] `pnpm test` で全テストが通ることを確認

### 3. Satori テンプレート

- [x] `src/lib/ogp/render-post-image.tsx` を実装
- [x] `src/lib/ogp/render-def-image.tsx` を実装

### 4. OGP 画像エンドポイント

- [x] `src/pages/ogp/posts/[slug].png.ts` を実装
- [x] `src/pages/ogp/defs/[id].png.ts` を実装
- [x] `pnpm build` でビルドが通り `dist/ogp/posts/*.png` `dist/ogp/defs/*.png` が生成されることを確認

### 5. Layout.astro 拡張

- [x] `Layout.astro` の Props に `description?: string` / `ogImage?: string` を追加
- [x] `ogImage` が指定されている場合のみ OGP タグを `<head>` に出力する
- [x] `canonicalUrl` は `Astro.site` + `Astro.url.pathname` から計算
- [x] `Astro.site` が未設定の場合は OGP タグを出力しない

### 6. Post ページに OGP を渡す

- [x] `src/pages/posts/[slug].astro` で description を解決 (frontmatter → 本文冒頭 120 文字)
- [x] Layout に `description` と `ogImage` を追加

### 7. Definition ページに OGP を渡す

- [x] `src/pages/defs/[id].astro` で description を解決 (body 冒頭 120 文字)
- [x] Layout に `description` と `ogImage` を追加

### 8. e2e テスト追加

- [x] Post ページ og:image / og:description / og:site_name / twitter:card
- [x] Definition ページ og:image / og:description
- [x] Home / 記事一覧ページに og:image がないことを確認
- [x] OGP 画像 URL が 200 + image/png を返すことを確認
- [x] `pnpm test:e2e` で全テストが通ることを確認 (10/10)

## 完了条件

- [x] `pnpm astro check` エラーなし
- [x] `pnpm lint` エラーなし
- [x] `pnpm test` 全通過 (219 tests)
- [x] `pnpm build` 成功。`dist/ogp/posts/*.png` と `dist/ogp/defs/*.png` が生成される
- [x] `pnpm test:e2e` 全通過 (10/10)

## 作業ログ

- 2026-05-20: 作業開始。feat/issue-53-ogp ブランチを作成。
- 2026-05-21: 全チェックリスト完了。astro check / lint / test (219) / build / e2e (10) すべて通過。
