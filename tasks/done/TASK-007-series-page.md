# TASK-007: series-page 実装

## 参照仕様

- docs/features/series-page.md

## 実装チェックリスト

### content/ + src/content.config.ts

- [x] `content/series/test-series.md` フィクスチャ作成 (e2e テスト用)
- [x] `src/content.config.ts` に series コレクション追加

### src/styles/global.css

- [x] `.series-page__*` / `.series-post-*` / `.upcoming-badge` / `.series-nav*` CSS 追加

### src/pages/series/[slug].astro

- [x] series-page 本体実装 (Breadcrumb・header・記事リスト・draft バッジ)

### src/pages/posts/[slug].astro

- [x] series-nav (prev/next) 追加
- [x] series-banner の seriesTitle をスラグ → コレクション title に差し替え

### src/pages/index.astro

- [x] series-card の seriesTitle をスラグ → コレクション title に差し替え

## 完了条件

- [x] pnpm test 全通過 (95 tests)
- [x] pnpm astro check クリーン (0 errors)
- [x] pnpm lint クリーン
- [x] pnpm build 成功
- [x] pnpm test:e2e 全通過 (81 tests)

## 作業ログ

- 2026-04-22: 作業開始
