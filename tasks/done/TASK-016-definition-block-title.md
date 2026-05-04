# TASK-016: definition-block-title

## 参照仕様

- docs/features/definition-block.md
- docs/features/local-definition.md
- docs/features/embed-definition.md
- docs/features/def-page.md
- docs/spec.md
- Issue #43: 定義ブロックの見た目を改善

## チェックリスト

- [x] グローバル定義・ローカル定義のタイトル表示仕様を更新する
- [x] RED: 定義タイトル表示のテストを追加して失敗を確認する
- [x] GREEN: remark プラグインと CSS を更新してテストを通す
- [x] REFACTOR: 仕様・実装・既存挙動の整合を確認する

## 完了条件

- [x] グローバル定義のラベルが `定義 (タイトル)` 形式で表示できる
- [x] `::embed[term]` のラベルが `定義 N (タイトル)` 形式で表示できる
- [x] ローカル定義が `:::definition{#id title="タイトル"}` でタイトルを表示できる
- [x] 対象テストと品質チェックが通る

## 作業ログ

- 2026-05-03: 作業開始。Issue #43 を確認し、TDD で仕様更新から着手。
- 2026-05-03: RED でタイトル表示テストの失敗を確認し、remark/CSS 実装で GREEN。`pnpm astro check`、`pnpm lint`、`pnpm test`、`pnpm build` を通過。
