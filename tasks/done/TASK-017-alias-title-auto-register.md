# TASK-017: alias に title を自動登録 (Issue #40)

## 参照仕様

- docs/features/concept-link.md — buildAliasMap: title を自動登録
- docs/features/def-page.md — displayAliases から id と title を除外

## チェックリスト

- [x] alias-map.test.ts: title 自動登録のテストを追加
- [x] alias-map.ts: buildAliasMap で title も keys に含める・シグネチャ更新
- [x] alias-map.ts: 呼び出し側に title を渡す (pages/defs/[id].astro・pages/posts/[slug].astro)
- [x] [id].astro: displayAliases フィルタから title も除外
- [x] content/defs/*.md: aliases から title と重複するエントリを削除
- [x] pnpm test が通る

## 完了条件

- [x] `[[半順序集合]]` が aliases に書かなくても解決される
- [x] def-page の「別名:」欄に title と同じ語が表示されない
- [x] 既存テストがすべて通る (192 tests passed)

## 作業ログ

- 2026-05-07: 作業開始
