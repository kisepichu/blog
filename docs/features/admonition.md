# admonition

## 概要

`:::warning` / `:::info` / `:::tip` / `:::note` ディレクティブを **admonition ブロック** としてパース・レンダリングする remark プラグイン。`definition-block` の色違いバリアントとして、注意・情報・ヒント・メモを記事内で表現するために使う。

## 仕様

### 入力構文

```markdown
:::warning
この操作は元に戻せません。
:::

:::info
参考情報をここに記載する。
:::

:::tip
効率的な書き方のコツ。
:::

:::note
補足メモ。
:::
```

`remark-directive` の `containerDirective` として解析され、`remarkAdmonition` プラグインが変換する。

### サポートする種別

| ディレクティブ | クラス | 色 (トークン) | ラベル |
|---|---|---|---|
| `:::warning` | `admonition admonition--warning` | amber (`--amber-*`) | `⚠ 警告` |
| `:::info`    | `admonition admonition--info`    | lav (`--lav-*`)     | `ℹ 情報` |
| `:::tip`     | `admonition admonition--tip`     | sage (`--sage-*`)   | `💡 ヒント` |
| `:::note`    | `admonition admonition--note`    | peach (`--peach-*`) | `📝 注` |

### 出力 HTML

```html
<div class="admonition admonition--warning">
  <p>この操作は元に戻せません。</p>
</div>
```

- クラス: `admonition admonition--{type}`
- ラベル (`::before`) は CSS で表示する。プラグイン側は出力しない。
- スタイリングは `global.css` の `ADMONITION` セクションで定義する。

### 制約

- admonition は hover preview・検索インデックスの対象外 (`data-pagefind-body` は付与しない)。
- ネストは想定しない。
- 対象外のディレクティブ名は `remarkAdmonition` が無視する (他プラグインに処理を委ねる)。
- `:::definition` と同一ファイルに混在して良い。

## 実装対象ファイル

| ファイル | 役割 |
|---------|------|
| `src/lib/remark/remark-admonition.ts` | プラグイン本体 |
| `src/lib/remark/remark-admonition.test.ts` | Vitest テスト |
| `src/styles/global.css` | admonition CSS (`ADMONITION` セクションを追加) |
| `astro.config.ts` | `remarkPlugins` に追加 (`remarkDefinitionBlock` の後) |

## テスト戦略 (Vitest)

テストケース:

| ケース | 期待出力 |
|--------|----------|
| `:::warning` | `<div class="admonition admonition--warning">...</div>` |
| `:::info`    | `<div class="admonition admonition--info">...</div>` |
| `:::tip`     | `<div class="admonition admonition--tip">...</div>` |
| `:::note`    | `<div class="admonition admonition--note">...</div>` |
| 内部に `$...$` を含む | そのまま通過 |
| 内部が空 | 空の div を出力 |
| 未知のディレクティブ名 | 変換しない (スキップ) |
| `data-pagefind-body` | 付与しない |

## エッジケース

| ケース | 挙動 |
|--------|------|
| 複数の admonition | それぞれ独立して変換 (件数制限なし) |
| `:::definition` と混在 | `remarkDefinitionBlock` と独立して動作 |
| 未知の型名 | スキップ |
| 内部コンテンツが空 | 空 div として出力 |

## 未決事項

なし
