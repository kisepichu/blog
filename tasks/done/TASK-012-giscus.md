# TASK-012: giscus 実装

## 参照仕様

- docs/features/giscus.md

## 実装チェックリスト

### src/components/

- [x] `GiscusComments.astro` — giscus スクリプトを埋め込むコンポーネント作成

### src/pages/

- [x] `posts/[slug].astro` — Backlinks の下に `<GiscusComments />` を追加
- [x] `defs/[id].astro` — Backlinks の下に `<GiscusComments />` を追加

## 完了条件

- [x] pnpm lint 全通過
- [x] pnpm test 全通過
- [x] pnpm test:e2e 全通過
- [x] pnpm astro check クリーン
- [x] pnpm build 成功

## 作業ログ

- 2026-04-27: 作業開始
