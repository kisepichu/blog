# TASK-013: def-english 実装

## 参照仕様

- docs/features/def-page.md
- docs/features/concept-link.md

## 概要

1. Definition frontmatter に `english` フィールド (required) を追加
2. `[[term]]` リンクのテキストを `{title}({english})` 形式に変更

## 実装チェックリスト

### src/lib/build/

- [x] `alias-map.ts`: `DefEntry` に `title: string`・`english: string` を追加、`buildDefMetaMap` を追加
- [x] `alias-map.test.ts`: `buildDefMetaMap` のテストを追加

### src/lib/remark/

- [x] `remark-concept-link.ts`: `ConceptLinkOptions` に `defMetaMap` を追加し、リンクテキストを `{title}({english})` に変更
- [x] `remark-concept-link.test.ts`: リンクテキストのテストを更新

### src/content.config.ts

- [x] defs schema に `english: z.string()` を追加 (required)

### content/defs/

- [x] 各 def ファイルに `english` フィールドを追加

### astro.config.ts

- [x] `buildDefMetaMap` を呼び出し、`remarkConceptLink` に `defMetaMap` を渡す

### src/pages/

- [x] `defs/[id].astro`: def-meta セクションに英語名を表示

## 完了条件

- [x] pnpm test 全通過
- [x] pnpm astro check クリーン
- [x] pnpm build 成功

## 作業ログ

- 2026-04-30: 作業開始・完了
