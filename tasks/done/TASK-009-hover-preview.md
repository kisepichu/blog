# TASK-009: hover-preview 実装

## 参照仕様

- docs/features/hover-preview.md

## 実装チェックリスト

### src/lib/remark/

- [x] `remark-concept-link.ts`: ローカル定義リンク出力に `data-local-id` を追加
- [x] `remark-concept-link.test.ts`: `data-local-id` 出力テストを追加

### src/components/

- [x] `HoverPreview.tsx`: React island 本体 (ポップアップ・イベント管理・スタック管理)
- [x] `HoverPreview.module.css`: `.hover-preview` / `__title` / `__body` スタイル
- [x] `Layout.astro`: `<HoverPreview client:load />` を追加

### src/pages/ (e2e)

- [x] `e2e/hover-preview.e2e.ts`: Playwright e2e テスト

## 完了条件

- [x] pnpm test 全通過 (112 tests)
- [x] pnpm lint クリーン
- [x] pnpm build 成功
- [x] pnpm test:e2e 全通過 (4 tests)

## 作業ログ

- 2026-04-24: 作業開始・完了
