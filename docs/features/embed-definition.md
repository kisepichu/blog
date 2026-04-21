# embed-definition

## 概要

`::embed[term]` 記法でグローバル Definition の definition_block をビルド時にページへ静的展開する。
hover preview とは異なり、ページのコンテンツとして HTML に埋め込まれる。
埋め込み順に定義番号が振られる。

## 仕様

### 入力構文

```markdown
ここで基本概念を定義する。

::embed[poset]

::embed[upper-bound]

以上を踏まえて...
```

`remark-directive` の `leafDirective` として解析され、`remarkEmbedDefinition` プラグインが変換する。
`term` は alias-map で解決する (`[[term]]` と同じ解決ロジック)。

body を持たないため container directive (`:::`) ではなく leaf directive (`::`) を使う。

### 出力 HTML

```html
<div class="definition-block definition-block--embedded" data-def-number="1">
  <span class="definition-number">定義 1</span>
  <!-- defContentMap[canonicalId].html の内容 -->
  <p><strong>半順序集合</strong> (poset) とは...</p>
</div>
```

- `data-def-number`: ページ内での順番 (1 始まり)
- `definition-number` span: 表示用ラベル (スタイリングは ui-base で定義)
- 内部の `[[term]]` リンクは defContentMap 構築時に `<a class="concept-link">` として変換済み
  → hover-preview React island がクライアントサイドで処理するため hover preview も有効

### 定義番号

- スコープ: 1 ページ内
- 順序: AST の上から下の出現順
- カウント対象: `::embed[term]` および `:::definition{#id}` ローカル定義の両方を同一カウンターで連番
- ローカル定義の出力例: `<div class="definition-block definition-block--local" id="..." data-def-number="1"><span class="definition-number">定義 1</span>...</div>`

> **実装上の注意**: Phase 1 の `remarkEmbedDefinition` は `::embed` のみカウントしていた。
> Phase 2 の post-page 実装時に、ローカル定義もカウントするよう修正が必要。
> 方法: `remarkEmbedDefinition` 内で AST を走査し `:::definition{#id}` ノードにも番号を付与する
> (または専用の `remarkDefNumberer` プラグインを追加する)。

### 解決失敗時

| 環境 | 挙動 |
|------|------|
| 開発 | `<div class="definition-block--embed-unresolved">term</div>` |
| 本番 | プレーンテキスト + console.warn。ビルドは止めない。 |

---

## defContentMap (共有インフラ)

`embed-definition` と `preview-index` が共有する Definition コンテンツのマップ。
`astro:config:setup` フックで 1 回だけ構築する。

```ts
// src/lib/build/def-content-map.ts
interface DefContentEntry {
  title: string
  html: string    // definition_block の innerHTML (外側 div は含まない)
}
type DefContentMap = Record<string, DefContentEntry>  // canonical id → entry

export async function buildDefContentMap(
  defs: DefEntry[],
  aliasMap: AliasMap,
  baseUrl: string
): Promise<DefContentMap>
```

構築フロー:
1. 各 def ファイルの body (生 Markdown) を `fs` で読み込む
2. remark パイプライン (remarkDefinitionBlock + remarkConceptLink) で HTML に変換
3. `extractDefinitionBlockHtml(html)` で inner HTML を抽出 (preview-index と共有)
4. `{ title, html }` として canonical id をキーに登録

> **実装上の前提**: `remarkEmbedDefinition` は取得した `defContent.html` を mdast の `type: 'html'` raw ノードとして AST に挿入する。
> これが出力に含まれるには remark-rehype に `allowDangerousHtml: true` が必要。
> Astro の Markdown パイプラインはこれをデフォルトで有効にしているため動作する。
> HAST へのパースによる改善は将来の課題とする。

`definition-block` が 0 個のファイルはエントリを含めない + console.warn。

`astro:config:setup` フック全体のフロー:

```ts
// astro.config.ts — integration フック内
const isProd = process.env.NODE_ENV === 'production'
const allDefs = scanDefsDirectory('content/defs/')
const defs = isProd ? allDefs.filter(d => d.status === 'published') : allDefs
const aliasMap = buildAliasMap(defs)
const defContentMap = await buildDefContentMap(defs, aliasMap, baseUrl)

// preview-index.json を config:setup 時点で生成 (getStaticPaths ではなくここで)
writePreviewIndex(defContentMap, 'public/preview-index.json')

// remark plugins に注入
updateConfig({
  markdown: {
    remarkPlugins: [
      remarkDirective,
      remarkDefinitionBlock,
      remarkLocalDefinition,
      [remarkConceptLink, { aliasMap, baseUrl, isProd }],
      [remarkEmbedDefinition, { defContentMap, aliasMap, isProd }],
    ],
  },
})
```

---

## バックリンク

`::embed[term]` は `[[term]]` と同等のバックリンク参照として扱う。
`backlink-graph` のスキャン対象に含める (`parse-concept-links.ts` に `parseEmbeds` を追加)。

---

## 実装対象ファイル

| ファイル | 役割 |
|---------|------|
| `src/lib/build/def-content-map.ts` | `buildDefContentMap`・`writePreviewIndex` |
| `src/lib/build/def-content-map.test.ts` | Vitest テスト |
| `src/lib/build/extract-definition-block.ts` | `extractDefinitionBlockHtml` (preview-index と共有) |
| `src/lib/remark/remark-embed-definition.ts` | remark プラグイン本体 |
| `src/lib/remark/remark-embed-definition.test.ts` | Vitest テスト |
| `src/lib/remark/parse-concept-links.ts` | `parseEmbeds` を追加 |
| `astro.config.ts` | integration フックでの構築・注入 |

## テスト戦略 (Vitest)

**`buildDefContentMap` テスト:**

| ケース | 期待出力 |
|--------|---------|
| 正常な def | `{ title, html }` が登録される |
| definition-block なし | そのエントリは含まない + console.warn |
| 本番フィルタリング | draft/scrap が除外される |

**`remarkEmbedDefinition` テスト:**

| ケース | 期待出力 |
|--------|---------|
| 基本埋め込み | `<div class="definition-block definition-block--embedded" data-def-number="1">` |
| alias 経由で解決 | 正しく埋め込まれる |
| 複数 embed | 連番が振られる (`data-def-number="1"`, `"2"`, ...) |
| 解決失敗 (開発) | `definition-block--embed-unresolved` クラス |
| 解決失敗 (本番) | プレーンテキスト + console.warn |

## エッジケース

| ケース | 挙動 |
|--------|------|
| 未解決の term | 開発: unresolved div、本番: プレーンテキスト + warn |
| 同じ Definition を複数回 embed | それぞれ別の定義番号が振られる |
| embed 内の concept-link | hover-preview が有効 |
| embed した Definition が自身を `[[term]]` で参照 | concept-link として有効 (循環参照は許容) |

## 未決事項

なし
