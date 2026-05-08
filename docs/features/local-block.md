# local-block

## 概要

`:::theorem{#id}` / `:::example{#id}` / `:::remark{#id}` / `:::notation{#id}` ディレクティブを**ローカルブロック**としてパース・レンダリングする remark プラグイン。設定ファイル (`local-block-config.ts`) でブロック種別を管理し、種別を追加するだけで新ディレクティブが使えるようになる。

`[[#id]]` による同一ページ内参照・hover preview に対応する (既存の `local-definition` / `concept-link` / `hover-preview` の仕組みを流用)。

## 仕様

### 設定ファイル

```ts
// src/lib/remark/local-block-config.ts
export interface LocalBlockType {
  name: string            // directive 名 (例: "theorem")
  label: string           // 表示ラベル (例: "定理")
  colorToken: string      // tokens.css のカラートークン名 (例: "lav")
  pagefindIgnore: boolean // true → data-pagefind-ignore 付与
}

export const LOCAL_BLOCK_TYPES: LocalBlockType[] = [
  { name: 'theorem',  label: '定理',  colorToken: 'lav',   pagefindIgnore: false },
  { name: 'example',  label: '例',    colorToken: 'sage',  pagefindIgnore: true  },
  { name: 'remark',   label: '注意',  colorToken: 'amber', pagefindIgnore: false },
  { name: 'notation', label: '記法',  colorToken: 'peach', pagefindIgnore: false },
]
```

新しいブロック種別を追加するには:
1. `LOCAL_BLOCK_TYPES` にエントリを追加するだけ。CSS 変更は不要。

### 入力構文

```markdown
:::theorem{#id title="定理名"}
$f$ が連続ならば...
:::

:::example{#ex1}
例を示す。
:::
```

- `remark-directive` の `containerDirective` として解析
- `{#id}` は**必須** — ない場合は `console.warn` を出力してスキップ (変換しない)
- `title` は省略可能。省略時は `id` を表示タイトルとして使う

### 出力 HTML

```html
<div class="local-block theorem-block"
     id="id"
     data-block-title="定理名"
     data-block-label="定理"
     style="--block-bg:var(--lav-bg);--block-b:var(--lav-b);--block-fg:var(--lav)">
  <p>$f$ が連続ならば...</p>
</div>
```

`pagefindIgnore: true` のブロックは `data-pagefind-ignore` 属性を付与する:

```html
<div class="local-block example-block"
     id="ex1"
     data-block-title="ex1"
     data-block-label="例"
     style="--block-bg:var(--sage-bg);--block-b:var(--sage-b);--block-fg:var(--sage)"
     data-pagefind-ignore>
  ...
</div>
```

- クラス名: `local-block ${name}-block` (共通クラス + 種別クラス)
- `id` 属性でページ内アンカーになる
- `data-block-title` にタイトルを格納
- `data-block-label` に設定ファイルの `label` を格納 (CSS の `attr()` で `▶ 定理 (定理名)` 形式に描画)
- inline style に CSS カスタムプロパティとして `colorToken` を注入 (`--block-bg` / `--block-b` / `--block-fg`)

### CSS (ラベル表示)

共通クラス `.local-block` に CSS カスタムプロパティ経由でスタイルを集約する。種別追加時の CSS 変更は不要。

```css
.local-block {
  background: var(--block-bg);   /* inline style から注入 */
  border: 1.5px solid var(--block-b);
  /* ... */
}
.local-block::before {
  content: '▶ ' attr(data-block-label);  /* label を attr() で参照 */
  color: var(--block-fg);
}
.local-block[data-block-title]::before {
  content: '▶ ' attr(data-block-label) ' (' attr(data-block-title) ')';
}
```

### 参照・hover preview

```markdown
[[#id]] を参照する  ← 同一ページ内参照
```

- `remarkLocalBlock` が `file.data.localIds` に id を追加
- `remarkConceptLink` が `[[#id]]` を `concept-link--local` リンクに変換 (変更不要)
- hover preview は `document.getElementById(id)` の innerHTML を使用 (HoverPreview 変更不要)

### `:::definition{#id}` との関係

- `:::definition{#id}` は引き続き `remarkLocalDefinition` が処理 (変更なし)
- `remarkLocalBlock` は `definition` ディレクティブを対象外とする

### パイプライン内の実行順

```
remarkParse
  → remarkDirective
  → remarkDefinitionBlock   (:::definition を処理)
  → remarkLocalDefinition   (:::definition{#id} を処理、localIds を設定)
  → remarkLocalBlock        (:::theorem{#id} 等を処理、localIds に追加)
  → remarkConceptLink       (localIds を参照しながら [[term]] / [[#id]] を解決)
  → remarkEmbedDefinition
  → remarkRehype
```

## 実装対象ファイル

| ファイル | 役割 |
|---------|------|
| `src/lib/remark/local-block-config.ts` | ブロック種別設定 (label / colorToken / pagefindIgnore) |
| `src/lib/remark/remark-local-block.ts` | プラグイン本体。設定値を data 属性・inline style として出力 |
| `src/lib/remark/remark-local-block.test.ts` | Vitest テスト |
| `src/styles/global.css` | `.local-block` 共通 CSS (`LOCAL-BLOCK` セクション) |
| `astro.config.ts` | `remarkPlugins` に `remarkLocalBlock` を追加 |

## テスト戦略 (Vitest)

| ケース | 期待出力 |
|--------|---------|
| `:::theorem{#id title="定理名"}` | `class="local-block theorem-block"` + `data-block-title="定理名"` + `data-block-label="定理"` + inline style |
| `:::example{#id}` | `class="local-block example-block"` + `data-pagefind-ignore` あり |
| `:::theorem{#id}` (title 省略) | `data-block-title="id"` (id をフォールバック) |
| `:::theorem` (id なし) | 変換されない + console.warn |
| `:::definition{#id}` | remarkLocalBlock がスキップ (remarkLocalDefinition が処理) |
| id が `file.data.localIds` に追加される | `localIds.has('id')` が true |
| 複数ブロック混在 | それぞれ独立して変換・localIds 収集 |
| 内部コンテンツが空 | 空 div として出力 |
| 未知のディレクティブ名 | スキップ |

## エッジケース

| ケース | 挙動 |
|--------|------|
| `{#id}` なし | console.warn + 変換スキップ |
| `title` 省略 | `data-block-title` に id を使う |
| `:::definition{#id}` と混在 | remarkLocalDefinition と独立して動作 |
| admonition と混在 | それぞれ独立して動作 |
| pagefindIgnore: false | `data-pagefind-ignore` を付与しない |
| pagefindIgnore: true | `data-pagefind-ignore` を付与する |

## 未決事項

なし
