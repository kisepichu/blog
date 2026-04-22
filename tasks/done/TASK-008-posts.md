# TASK-008: posts 一覧ページ実装

## 参照仕様

- docs/features/posts.md

## 実装チェックリスト

### src/components/

- [x] `PostCard.astro` 作成 (title / href / date? / tags / series? / seriesOrder? を受け取る)
- [x] `src/pages/index.astro` で PostCard コンポーネントを使用するよう差し替え

### src/styles/global.css

- [x] `.post-card` スタイルを global.css に移動 (index.astro にインラインなら)
- [x] `.posts-pagination` / `.posts-pagination__btn` / `.posts-pagination__info` CSS 追加

### src/pages/posts/

- [x] `index.astro` 作成 (1ページ目: post-card 一覧・section-title・Breadcrumb・pagination)
- [x] `page/[page].astro` 作成 (2ページ目以降: getStaticPaths + pagination)

### src/pages/posts/[slug].astro

- [x] Breadcrumb の "Posts" を `href: \`${base}/posts\`` でリンク化

## 完了条件

- [x] pnpm test 全通過 (95 tests)
- [x] pnpm astro check クリーン (0 errors)
- [x] pnpm lint クリーン
- [x] pnpm build 成功
- [x] pnpm test:e2e 全通過 (99 tests)

## 作業ログ

- 2026-04-22: 作業開始・完了
