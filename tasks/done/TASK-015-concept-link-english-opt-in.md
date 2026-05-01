# TASK-015: concept-link 英語表示のオプトイン化 (issue #33)

## 参照仕様

- docs/features/concept-link.md

## 概要

- 現状: `[[term]]` → `title(english)` 形式でリンクテキストを出力
- 変更後:
  - `[[term]]` → `title` のみ (英語なし)
  - `![[term]]` → `title(english)` (英語をかっこ書きで表示)

## チェックリスト

### テスト (先に書く)

- [x] `remark-concept-link.test.ts`: `[[term]]` で title のみになるテストを追加・既存テストを修正
- [x] `remark-concept-link.test.ts`: `![[term]]` で `title(english)` になるテストを追加
- [x] `parse-concept-links.test.ts`: `![[term]]` もパースされるテストを追加

### 実装

- [x] `src/lib/remark/parse-concept-links.ts`: `CONCEPT_LINK_REGEX` を `!?\[\[...\]\]` に更新
- [x] `src/lib/remark/remark-concept-link.ts`: regex を `(!?)\[\[...\]\]` に変更、`!` 有無で英語表示を切り替え

### 仕様更新

- [x] `docs/features/concept-link.md`: `![[term]]` 記法と新しいデフォルト動作を反映

## 完了条件

- [x] `pnpm test` 全通過 (174 passed)
- [x] `pnpm astro check` クリーン (0 errors)
- [x] `pnpm build` 成功

## 作業ログ

- 2026-05-01: 作業開始・完了
