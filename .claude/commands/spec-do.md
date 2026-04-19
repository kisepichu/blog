機能の仕様からタスクファイルを生成し、実装を開始する。

## 手順

1. 引数から機能名を取得する (例: `/spec-do concept-link` → `concept-link`)
   - 引数がなければ「どの機能を実装しますか?」と聞く
2. `docs/features/{feature}.md` を読む。なければ `docs/spec.md` の該当部分を読む
3. `CLAUDE.md` のアーキテクチャルールを確認する
4. 実装をレイヤーごとに分解してタスクを洗い出す
5. タスクファイルを `tasks/doing/TASK-NNN-{feature}.md` に作成する。ブランチの切り方をユーザーに確認する
   - NNN は既存タスクの連番 (todo/ doing/ done/ を合わせて最大番号 + 1)
6. タスクファイルのチェックリスト項目ごとに以下の TDD サイクルを回す:

   **RED フェーズ** — `.claude/agents/test-writer.md` のテンプレートを使い、
   test-writer subagent を Agent ツールで起動する。

   - subagent がテストを書き、`pnpm test` で失敗を確認してレポートを返す
   - テストが期待通りに失敗していることを確認してから次へ進む

   **GREEN フェーズ** — `.claude/agents/implementer.md` のテンプレートを使い、
   implementer subagent を Agent ツールで起動する。

   - test-writer のレポート (失敗したテスト名・ファイルパス) をプロンプトに含める
   - subagent が最小限の実装を書き、`pnpm test` で全テスト通過を確認してレポートを返す

   **REFACTOR フェーズ** — 全テストが通る状態を維持しながらリファクタリングする

   次のチェックリスト項目へ進む前に、必ず GREEN まで完了させること

   > **src/pages/ の項目**: Vitest ではなく Playwright を使う (pnpm test:e2e)

7. `pnpm astro check` で型チェック、`pnpm lint` で lint、`pnpm test` で全テスト通過を確認する

## タスクファイル形式

```markdown
# TASK-{NNN}: {feature} 実装

## 参照仕様

- docs/features/{feature}.md

## 実装チェックリスト

### src/lib/remark/

- [ ] ...

### src/lib/build/

- [ ] ...

### src/components/

- [ ] ...

### src/pages/

- [ ] ...

## 完了条件

- [ ] pnpm test 全通過
- [ ] pnpm astro check クリーン
- [ ] pnpm build 成功

## 作業ログ

- {date}: 作業開始
```

## 注意

- `src/lib/` → `src/components/` → `src/pages/` の順で実装する
- 仕様に曖昧な点があればユーザーに確認してから実装する
- 完了したチェックリスト項目はその都度 `[x]` に更新する
- 完了時は `tasks/doing/` から `tasks/done/` に移動する
