# definition-block

## 概要

`:::definition` ディレクティブを **definition_block** としてパース・レンダリングする remark プラグイン。
hover preview・検索インデックス・def-page の表示すべてがこのブロックを対象とする。

## 仕様

### 入力構文

```markdown
:::definition
**半順序集合** (poset) とは、集合 $P$ と反射的・反対称的・推移的な
二項関係 $\leq$ の組 $(P, \leq)$ である。
:::
```

`remark-directive` の `containerDirective` として解析され、`remarkDefinitionBlock` プラグインが変換する。

### 出力 HTML

```html
<div class="definition-block" data-def-title="半順序集合">
  <p><strong>半順序集合</strong> (poset) とは...</p>
</div>
```

- クラス名: `definition-block`
- Definition ファイルの frontmatter `title` が取得できる場合は `data-def-title` を付与する。
- 表示ラベルは CSS で `▶ 定義 (半順序集合)` のように描画する。
- スタイリング (枠・背景色等) は `ui-base` で定義する。このプラグインはクラス付与とタイトル属性付与のみ担う。

### `:::definition{#id}` との分離

`:::definition{#id}` (ID 付き) は `local-definition` 機能のプラグインが処理する。
`remarkDefinitionBlock` は `id` 属性のある directive を **スキップ** する (変換しない)。

### 複数の `:::definition` が含まれる場合

先頭の 1 つを definition_block とし、2 つ目以降は `definition-block--extra` クラスで出力 + `console.warn` でビルド警告を発出する。

| 番目 | 出力 |
|------|------|
| 1 番目 | `<div class="definition-block">` |
| 2 番目以降 | `<div class="definition-block--extra">` + console.warn |

`definition-block--extra` のスタイリングは `ui-base` で定める。

### `:::definition` が 0 個の場合

`remarkDefinitionBlock` は何もしない。ビルド警告は **preview-index** 生成側が発出する
(Definition ファイルであるという文脈を知っているのが preview-index のため)。

## 実装対象ファイル

| ファイル | 役割 |
|---------|------|
| `src/lib/remark/remark-definition-block.ts` | プラグイン本体 |
| `src/lib/remark/remark-definition-block.test.ts` | Vitest テスト |
| `astro.config.ts` | `remarkPlugins` に追加 |

## テスト戦略 (Vitest)

remark パイプラインを使った純粋関数テスト:

```ts
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkDefinitionBlock from './remark-definition-block'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const process = (md: string) =>
  unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkDefinitionBlock)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(md)
    .toString()
```

テストケース:

| ケース | 期待出力 |
|--------|---------|
| 基本変換 | `<div class="definition-block">...</div>` |
| title 指定 | `<div class="definition-block" data-def-title="...">...</div>` |
| 複数ブロック | 先頭: `definition-block`、残り: `definition-block--extra` |
| `:::definition{#id}` | スキップ (変換しない) |
| 内部に `$...$` を含む | そのまま通過 (MathJax はクライアントサイドで処理) |
| 内部が空 | `<div class="definition-block"></div>` |

## エッジケース

| ケース | 挙動 |
|--------|------|
| `:::definition` 0 個 | 何もしない (警告は preview-index 側) |
| `:::definition` 複数 | 先頭のみ `definition-block`、残りは `definition-block--extra` + console.warn |
| `:::definition{#id}` | スキップ (local-definition が処理) |
| 内部コンテンツが空 | 空 div として変換 |

## 未決事項

なし
