# concept-link

## 概要

`[[term]]` 記法を concept link としてパース・変換する remark プラグインと、
全 Definition の alias を解決する alias-map ビルダー。
alias-map は `local-definition`・`embed-definition`・`backlink-graph` でも共有する。

---

## alias-map

### 型定義

```ts
// alias/id → canonical id (1 対 1)
type AliasMap = Record<string, string>
```

### 構築

Astro integration の `astro:config:setup` フックで構築する。

```ts
// src/lib/build/alias-map.ts
interface DefEntry {
  id: string
  title: string
  english: string
  aliases: string[]
  status: 'published' | 'draft' | 'scrap'
}

// alias/id → canonical id (1 対 1)
type AliasMap = Record<string, string>

// canonical id → {title, english}
type DefMetaMap = Record<string, { title: string; english: string }>

export function scanDefsDirectory(dir: string): Array<DefEntry & { body: string }>
export function buildAliasMap(defs: Array<Pick<DefEntry, 'id' | 'aliases'>>): AliasMap
export function buildDefMetaMap(defs: DefEntry[]): DefMetaMap
```

- `id` 自体も alias として登録する (`"poset" → "poset"`)
- `aliases` の各エントリも登録する (`"半順序" → "poset"`)
- 本番ビルド時は `draft`・`scrap` の Definition を除外する

### alias 重複時

同じ alias が複数 Definition に登録されている場合:
- `console.warn` でビルド警告
- ファイル id のアルファベット順で先勝ち

### 構築タイミング

`astro:config:setup` フック全体のフロー (embed-definition・preview-index と共有):

```ts
// astro.config.ts — integration フック内
const isProd = command === 'build'
const allDefs = scanDefsDirectory('content/defs/')
const defs = isProd ? allDefs.filter(d => d.status === 'published') : allDefs
const aliasMap = buildAliasMap(defs)
const defMetaMap = buildDefMetaMap(defs)
const defContentMap = await buildDefContentMap(defs, aliasMap, defMetaMap, baseUrl)
                      // ↑ embed-definition・preview-index の共有インフラ

writePreviewIndex(defContentMap, 'public/preview-index.json')

updateConfig({
  markdown: {
    remarkPlugins: [
      remarkDirective,
      remarkDefinitionBlock,
      remarkLocalDefinition,
      [remarkConceptLink, { aliasMap, defMetaMap, baseUrl, isProd }],
      [remarkEmbedDefinition, { defContentMap, aliasMap, isProd }],
    ],
  },
})
```

---

## remark-concept-link プラグイン

### 入力

```markdown
[[半順序集合]] において [[上界]] が存在するとは限らない。
![[半順序集合]] において ...  ← 英語をかっこ書きで表示したい場合
```

`[[term]]` / `![[term]]` はインライン記法。remark の `text` ノードを walk して正規表現でパースする。

```ts
// src/lib/remark/parse-concept-links.ts (backlink-graph と共有)
// ![[term]] と [[term]] の両方にマッチする
export const CONCEPT_LINK_REGEX = /!?\[\[([^\]]+)\]\]/g
export function parseConceptLinks(text: string): string[]
// 将来予定: [[term|display]] 対応時は正規表現を変更
```

### `[[term|display]]` 記法 (将来予定 — 未実装)

> **注意**: 現状の実装 (`parse-concept-links.ts`, `remark-concept-link.ts`) は `[[term]]` / `![[term]]` に対応。
> `[[term|display]]` 記法は将来実装予定。

表示テキストを指定する場合: `[[解決キー|表示テキスト]]`

```markdown
[[judgment|判断]]        → 表示: 判断、href: /defs/judgment
[[poset|半順序集合]]      → 表示: 半順序集合、href: /defs/poset
[[poset]]                → 表示: poset (term そのまま)
```

- 解決 (alias-map 照合) には `term` 部分のみ使う
- `display` が省略された場合は `term` をリンクテキストにする

### 出力

**`[[term]]` 解決成功時 (英語なし・デフォルト):**

```html
<a class="concept-link" data-term="poset" href="/defs/poset">半順序集合</a>
```

**`![[term]]` 解決成功時 (英語あり):**

```html
<a class="concept-link" data-term="poset" href="/defs/poset">半順序集合(partially ordered set)</a>
```

- `data-term`: canonical id (hover-preview がこれを使って preview-index.json を引く)
- `href`: `{baseUrl}/defs/{canonicalId}`
- リンクテキスト:
  - `[[term]]`: `title` のみ
  - `![[term]]`: `title(english)` (`english` が空文字のときは `title` のみ)
  - `defMetaMap` が省略・未登録の場合: 元の `term` にフォールバック
  - (将来予定: `display` があればそれを使う)

**解決失敗時 (開発環境):**

```html
<a class="concept-link concept-link--unresolved" href="#">半順序集合</a>
```

**解決失敗時 (本番):**

```
半順序集合
```

プレーンテキスト出力 + `console.warn`。ビルドは止めない。

### ローカル定義との関係

`[[term]]` の解決順序:

1. 同一ページのローカル定義 id (`file.data.localIds`) と照合
2. alias-map (global Definition) と照合

`remarkLocalDefinition` が先に走り `file.data.localIds` を設定するため、
`remarkConceptLink` はこれを読み取って局所的に上書きできる。

```ts
// remark-concept-link.ts 内
const localIds: Set<string> = file.data.localIds ?? new Set()
```

### `[[#anchor]]` の処理

`[[#anchor]]` (先頭が `#`) も `remarkConceptLink` が処理する。
`remarkLocalDefinition` が事前に `file.data.localIds` を設定し、`remarkConceptLink` がそれを参照して以下を行う:

- `localIds` が未設定: スキップ (旧来の動作、通常発生しない)
- `localIds.has(id)` が true: `concept-link--local` リンク (`href="#id"`)
- `localIds` にない・開発: `concept-link--unresolved` リンク
- `localIds` にない・本番: プレーンテキスト + `console.warn`

`remarkLocalDefinition` の役割は `localIds` の収集のみであり、`[[#id]]` の HTML 変換は `remarkConceptLink` が担う。

### プラグインオプション

```ts
interface ConceptLinkOptions {
  aliasMap: AliasMap
  defMetaMap?: DefMetaMap // canonical id → {title, english} (リンクテキスト生成用、省略時は {})
  baseUrl: string    // Astro config.base (例: '/' または '/blog')
  isProd?: boolean   // 省略時は import.meta.env.PROD に準ずる
}
```

### パイプライン内の実行順

```
remarkParse
  → remarkDirective
  → remarkDefinitionBlock   (:::definition を処理)
  → remarkLocalDefinition   (:::definition{#id} を処理、localIds を file.data に設定)
  → remarkConceptLink       (localIds を参照しながら [[term]] を解決)
  → remarkEmbedDefinition   (::embed[term] を defContentMap から展開)
  → remarkRehype
```

---

## 実装対象ファイル

| ファイル | 役割 |
|---------|------|
| `src/lib/build/alias-map.ts` | `scanDefsDirectory`・`buildAliasMap` |
| `src/lib/build/alias-map.test.ts` | Vitest テスト |
| `src/lib/remark/parse-concept-links.ts` | 共有正規表現・パーサー (backlink-graph と共有) |
| `src/lib/remark/remark-concept-link.ts` | remark プラグイン |
| `src/lib/remark/remark-concept-link.test.ts` | Vitest テスト |
| `astro.config.ts` | integration フックでのビルドと注入 |

## テスト戦略 (Vitest)

**alias-map テスト:**

| ケース | 期待出力 |
|--------|---------|
| 基本構築 | id と aliases が正しく登録される |
| alias 重複 | アルファベット順で先勝ち + console.warn |
| 本番フィルタリング | draft/scrap が除外される |
| `buildDefMetaMap` 基本 | canonical id → `{title, english}` が正しく構築される |

**remark-concept-link テスト:**

| ケース | 期待出力 |
|--------|---------|
| `[[term]]` 基本リンク | `<a class="concept-link" data-term="..." href="...">title</a>` |
| `[[term]]` alias 経由で解決 | href は canonical id、テキストは title のみ |
| `![[term]]` 基本リンク | `<a class="concept-link" data-term="..." href="...">title(english)</a>` |
| `![[term]]` alias 経由で解決 | href は canonical id、テキストは title(english) |
| `![[term]]` english が空文字 | テキストは title のみ |
| `defMetaMap` なし | テキストは term にフォールバック |
| 解決失敗 (開発) | `<a class="concept-link concept-link--unresolved">` |
| 解決失敗 (本番) | プレーンテキスト |
| 1 ノードに複数 `[[term]]` | すべて変換される |
| `[[#anchor]]` | `localIds` に応じて local link / unresolved / plain text を出し分ける |

## エッジケース

| ケース | 挙動 |
|--------|------|
| alias 重複 | アルファベット順で先勝ち + console.warn |
| `[[term]]` 未解決 (開発) | `concept-link--unresolved` クラス付きリンク |
| `[[term]]` 未解決 (本番) | プレーンテキスト + console.warn |
| `[[#anchor]]` | `localIds` に応じて local link / unresolved / plain text を出し分け |
| term にスペースを含む | `[[直積 集合]]` → マッチ対象 (正規表現で許容) |

## 未決事項

なし
