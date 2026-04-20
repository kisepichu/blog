# TASK-002: Phase 1 コンテンツ記法実装

## 参照仕様

- docs/features/definition-block.md
- docs/features/concept-link.md
- docs/features/embed-definition.md
- docs/features/local-definition.md
- docs/features/preview-index.md
- docs/features/backlink-graph.md

## 実装チェックリスト

### definition-block

- [x] `src/lib/remark/remark-definition-block.ts` — `:::definition` → `<div class="definition-block">`
- [x] `astro.config.ts` に remarkPlugin として追加

### concept-link

- [x] `src/lib/build/alias-map.ts` — `scanDefsDirectory`, `buildAliasMap`
- [x] `src/lib/remark/parse-concept-links.ts` — `CONCEPT_LINK_REGEX`, `parseConceptLinks`
- [x] `src/lib/remark/remark-concept-link.ts` — `[[term]]` → concept-link HTML

### embed-definition

- [x] `src/lib/build/extract-definition-block.ts` — `extractDefinitionBlockHtml`
- [x] `src/lib/build/def-content-map.ts` — `buildDefContentMap`
- [x] `src/lib/remark/parse-concept-links.ts` に `EMBED_REGEX`, `parseEmbeds` 追加
- [x] `src/lib/remark/remark-embed-definition.ts` — `::embed[term]` → definition-block 静的展開

### local-definition

- [x] `src/lib/remark/remark-local-definition.ts` — `:::definition{#id}` → `div#id` + localIds 収集
- [x] `src/lib/remark/remark-concept-link.ts` に `file.data.localIds` 対応追加 (concept-link 修正)

### preview-index

- [x] `src/lib/build/preview-index.ts` — `writePreviewIndex`

### backlink-graph

- [x] `src/lib/build/backlink-graph.ts` — `getBacklinkGraph`, `extractReferences`, `resolveLinks`

### astro.config.ts 統合

- [x] integration フック実装 (alias-map + defContentMap + remarkPlugins 全部)

## 完了条件

- [x] `pnpm test` 全通過
- [x] `pnpm astro check` クリーン
- [x] `pnpm lint` クリーン
- [x] `pnpm build` 成功

## 作業ログ

- 2026-04-20: 作業開始、feat/phase-1-content ブランチ作成
- 2026-04-20: 全実装完了 (86 tests, lint clean, astro check clean, build success)
