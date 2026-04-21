# TASK-003: def-page 実装

## 参照仕様

- docs/features/def-page.md
- docs/spec.md

## 実装メモ

- `BacklinkEntry` の実際の型: `{ type: 'post' | 'definition', slug: string, title: string }`
  (spec の `type: 'post'|'def'` / `id` とは異なる。実装はこちらに合わせる)
- `getBacklinkGraph(entries, aliasMap)` は async。getStaticPaths 内でエントリを組み立てて呼ぶ
- CSS Modules はコンポーネント固有スタイルに使用。グローバル適用が必要なスタイル
  (`.definition-block`, `.prose`, `.concept-link` 等) は `global.css` に置く
- `tsconfig.json` は `resolveJsonModule` を明示していないが `astro/tsconfigs/strict` が有効にしている

## 実装チェックリスト

### src/lib/

- [x] `src/lib/tag-colors.ts` — `getTagColor(tag)`: JSON 設定 → fallback ハッシュ
- [x] `src/lib/tag-colors.test.ts` — Vitest テスト

### src/config/

- [x] `src/config/tag-colors.json` — 初期タグ色設定 (型理論:lav, 集合論:sage, ...)

### src/styles/

- [x] `src/styles/tokens.css` — CSS デザイントークン全量
- [x] `src/styles/global.css` — 更新: tokens.css @import + reset + layout + prose
  + `.definition-block` / `.concept-link` スタイル

### src/components/

- [x] `src/components/Layout.astro` — header + footer + slot + MathJax CDN
- [x] `src/components/Breadcrumb.astro`
- [x] `src/components/TagBadge.astro`
- [x] `src/components/Backlinks.astro`

### src/pages/

- [x] `src/pages/defs/[id].astro` — getStaticPaths + ページ本体
- [x] `src/pages/defs/def-page.e2e.ts` — Playwright e2e テスト

## 完了条件

- [x] `pnpm test` 全通過 (95 tests)
- [x] `pnpm astro check` クリーン
- [x] `pnpm lint` クリーン
- [x] `pnpm build` 成功
- [x] `pnpm test:e2e` 全通過 (8 tests)

## 作業ログ

- 2026-04-21: 作業開始、feat/phase-2-def-page ブランチ作成
- 2026-04-21: 全実装完了 (95 unit tests + 8 e2e tests, lint clean, astro check clean, build success)
