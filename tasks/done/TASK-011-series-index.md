# TASK-011: series-index 実装

## 参照仕様

- docs/features/series-index.md

## 実装チェックリスト

### src/pages/series/

- [x] `src/pages/series/index.astro` 新規作成 (全シリーズ一覧ページ)

### src/components/

- [x] `src/components/Layout.astro` — navItems に `series` 追加、activePage 型拡張

### src/pages/series/ (Breadcrumb 更新)

- [x] `src/pages/series/[slug].astro` — Breadcrumb "Series" をリンク (`/series`) に変更

### src/styles/

- [x] `src/styles/global.css` — `.series-index__*` スタイル追加

### e2e/

- [x] `e2e/series-index.e2e.ts` 新規作成
- [x] `e2e/series-page.e2e.ts` — "Series" Breadcrumb テストをリンクあり仕様に更新

## 完了条件

- [x] pnpm test 全通過 (149 tests)
- [x] pnpm test:e2e 全通過 (133 tests)
- [x] pnpm astro check クリーン
- [x] pnpm build 成功

## 作業ログ

- 2026-04-26: 作業開始
