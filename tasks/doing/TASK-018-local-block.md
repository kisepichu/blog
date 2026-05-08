# TASK-018: local-block

## 参照仕様

- docs/features/local-block.md

## チェックリスト

- [x] `src/lib/remark/local-block-config.ts` を作成 (設定ファイル)
- [x] `src/lib/remark/remark-local-block.test.ts` を作成 (先にテストを書く)
- [x] `src/lib/remark/remark-local-block.ts` を実装してテストをパスさせる
- [x] `src/styles/global.css` に `LOCAL-BLOCK` セクションを追加
- [x] `astro.config.ts` に `remarkLocalBlock` を追加
- [x] `pnpm test` がパスする (207 tests)
- [x] `pnpm astro check` がパスする (0 errors)
- [x] `pnpm build` がパスする

## 完了条件

- [x] `:::theorem{#id title="定理名"}` が `theorem-block` クラス付き div に変換される
- [x] `:::example{#id}` に `data-pagefind-ignore` が付与される
- [x] `{#id}` なしは console.warn + スキップ
- [x] id が `file.data.localIds` に追加され `[[#id]]` 参照が動く
- [x] テスト全パス・型チェック・ビルド通過

## 作業ログ

- 2026-05-08: 作業開始
