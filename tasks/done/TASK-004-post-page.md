# TASK-004: post-page 実装

## 参照仕様

- docs/features/post-page.md

## 実装チェックリスト

### src/content.config.ts

- [x] posts スキーマに `date` フィールドを追加 (z.union で string/Date 両対応)

### src/pages/

- [x] `src/pages/posts/[slug].astro` を新規作成
  - getStaticPaths: posts + defs を取得、aliasMap + backlinkGraph 構築
  - Layout (activePage="post") + Breadcrumb + series-banner + post-header + article + Backlinks
  - Pagefind メタデータ (type:post, tags, series)
  - status フィルタ (PROD 時 published のみ)

## 完了条件

- [x] pnpm test 全通過 (95 tests)
- [x] pnpm astro check クリーン
- [x] pnpm build 成功 (5 pages built)
- [x] pnpm test:e2e 全通過 (12 tests)
- [x] pnpm lint クリーン

## 作業ログ

- 2026-04-21: 作業開始・完了
