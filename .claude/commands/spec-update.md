機能仕様を更新する。

## 手順

1. 引数から機能名を取得する (例: `/spec-update hover-preview` → `hover-preview`)
   - 引数がなければ「どの機能の仕様を更新しますか?」と聞く
2. `docs/features/{feature}.md` が存在すれば読む。なければ `docs/spec.md` の該当部分を読む
3. 何を変更したいかをユーザーに確認し、議論して仕様を確定する
4. `docs/features/{feature}.md` を更新する (存在しなければ新規作成)
5. `docs/spec.md` の該当箇所も同期して更新する
6. 変更内容をサマリーで報告する

## ファイル形式 (docs/features/{feature}.md)

```markdown
# {feature}

## 概要
...

## 仕様
...

## 実装対象ファイル
- src/lib/...
- src/components/...
- src/pages/...

## エッジケース
...

## 未決事項
...
```

## 注意

- 仕様変更は必ず `docs/spec.md` にも反映する
- 実装済みの挙動と仕様が乖離する場合はユーザーに確認する
