# TASK-005: tag-page 実装

## 参照仕様

- docs/features/tag-page.md

## 実装チェックリスト

### src/styles/

- [x] `global.css` に `.section-title` / `.post-card` / `.def-compact` を追加

### src/pages/

- [x] `src/pages/defs/[id].astro` — TagBadge href の `encodeURIComponent` を除去
- [x] `src/pages/posts/[slug].astro` — TagBadge href の `encodeURIComponent` を除去
- [x] `src/pages/tags/[tag].astro` を新規作成

## 完了条件

- [x] pnpm test 全通過 (95 tests)
- [x] pnpm astro check クリーン
- [x] pnpm build 成功 (6 pages built)
- [x] pnpm test:e2e 全通過 (16 tests)
- [x] pnpm lint クリーン

## 作業ログ

- 2026-04-22: 作業開始・完了
