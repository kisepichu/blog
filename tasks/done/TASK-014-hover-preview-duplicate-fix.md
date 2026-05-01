# TASK-014: hover preview 重複表示バグ修正 (Issue #32)

## 参照仕様

- docs/features/hover-preview.md
- GitHub Issue #32

## 問題

popup の body HTML に自己参照 concept-link (同一 term) が含まれると、
popup が DOM に追加された直後にブラウザがその concept-link に `mouseenter` を再発火し、
同じ popup が何個も積み重なる。

**根因**: `suppressNewPopupRef` の setTimeout(0) は React の再描画よりも先に
フラグをリセットしてしまう場合がある。結果として popup 内の concept-link への
mouseenter が抑制されずに連鎖増殖する。

**修正方針**: popup を新規作成する前に、祖先 popup チェーンに同じ term / localId
がすでに存在するかを確認する。存在すれば新規作成をスキップする。

実装変更:
1. `PopupState` に `term: string | undefined` と `localId: string | undefined` を追加
2. `showPopupForLink` で祖先に同じ term/localId があればスキップ
3. (オプション) `suppressNewPopupRef` 機構は維持しつつ重複チェックを主防衛とする

## チェックリスト

- [x] 落ちるテストを書く: popup 内の同一 term concept-link への mouseenter で popup が重複しない
- [x] `PopupState` に `term` / `localId` フィールドを追加
- [x] `showPopupForLink` に祖先チェックを追加
- [x] テストがパスすることを確認
- [x] 既存テストが全てパスすることを確認 (`pnpm test`)

## 完了条件

- [x] `pnpm test` が全てパス
- [x] Issue #32 の再現シナリオ (自己参照 term) が 1 つの popup のみを表示する

## 作業ログ

- 2026-05-01: 作業開始
