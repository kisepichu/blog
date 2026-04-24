# TASK-010: search 実装

## 参照仕様

- docs/features/search.md
- docs/spec.md (検索インデックスセクション)

## 実装チェックリスト

### src/lib/remark/

- [x] `remark-definition-block.ts`: 生成する `.definition-block` div に `data-pagefind-body` 属性を追加

### src/components/

- [x] `SearchInterface.tsx`: Pagefind JS API + prefix filter (#tag/@type) + 結果表示 React island

### src/pages/

- [x] `src/pages/defs/[id].astro`: `data-pagefind-filter` 追加・`def-content` から `data-pagefind-body` 削除・タグを 1 タグ 1 span に変更
- [x] `src/pages/posts/[slug].astro`: `data-pagefind-filter` 追加・タグを 1 タグ 1 span に変更
- [x] `src/components/Layout.astro`: ヘッダー検索ボックス追加・`activePage` 型拡張
- [x] `src/pages/search.astro`: 新規作成

### ビルド設定

- [x] `pagefind` インストール (devDependencies)
- [x] `package.json` の `build` スクリプト更新: `"astro build && pagefind --site dist"`

## 完了条件

- [x] pnpm test 全通過 (126/126)
- [x] pnpm astro check クリーン (既存2件のみ、今回分はゼロ)
- [x] pnpm lint クリーン
- [x] pnpm build 成功 (pagefind インデックス生成まで、3ページインデックス済み)
- [x] pnpm test:e2e — search テスト 20/20 通過 (他スイートの既存失敗は別問題)

## 作業ログ

- 2026-04-24: 作業開始、feat/phase-3-search ブランチ作成
