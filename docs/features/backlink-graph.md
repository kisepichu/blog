# backlink-graph

## 概要

全 Markdown ファイルの `[[term]]` および `::embed[term]` 参照をスキャンし、各 Definition の backlink 一覧を生成する。
`getStaticPaths` 内で生成し、各ページに props として渡す。

## 出力型

```ts
type BacklinkEntry = {
  type: 'post' | 'definition'
  slug: string    // Post: slug、Definition: id
  title: string
}

// canonical Definition id → その Definition を参照しているページ一覧
type BacklinkGraph = Record<string, BacklinkEntry[]>
```

## 生成タイミング・場所

`src/pages/defs/[id].astro` と `src/pages/posts/[slug].astro` の `getStaticPaths` 内で使用する。
ビルド中に複数の `getStaticPaths` から呼ばれる可能性があるため、モジュールレベルでキャッシュする。

```ts
// src/lib/build/backlink-graph.ts
let cache: BacklinkGraph | null = null

export async function getBacklinkGraph(aliasMap: AliasMap): Promise<BacklinkGraph>
// 初回呼び出し時のみスキャンを実行し、以降はキャッシュを返す
```

## スキャン方法

`content/posts/*.md` と `content/defs/*.md` の全ファイルをスキャンして
`[[term]]` と `::embed[term]` を抽出し、alias-map で canonical id に解決して逆引きグラフを構築する。

```ts
// src/lib/build/backlink-graph.ts

export function extractReferences(markdown: string): string[]
// [[term]] と ::embed[term] を正規表現で抽出して term 文字列の配列を返す
// [[#id]] (ローカル参照) は除外する

export function resolveLinks(terms: string[], aliasMap: AliasMap): string[]
// alias-map で canonical id に解決する (未解決は除外)
```

`concept-link` の共有モジュールを使う:

```ts
// src/lib/remark/parse-concept-links.ts (concept-link feature で定義)
export const CONCEPT_LINK_REGEX = /\[\[([^\]]+)\]\]/g
export function parseConceptLinks(text: string): string[]

// embed-definition feature で追加
export const EMBED_REGEX = /^::embed\[([^\]]+)\]$/gm
export function parseEmbeds(text: string): string[]
```

- `[[#id]]` (先頭が `#`) は除外する
- `[[term]]` と `::embed[term]` は同等のバックリンクとして扱う
- 同じページから同じ Definition への複数参照は 1 件に集約する

## alias-map との連携

alias-map は `concept-link` feature の `buildAliasMap` で生成し、
Astro integration フック内で構築したものを `getBacklinkGraph` に渡す。

```ts
// astro.config.ts (integration フック内) の疑似コード
const aliasMap = buildAliasMap(defs)

// backlink-graph は getStaticPaths 内で aliasMap を受け取る
// → virtual module または global 変数経由での受け渡しは def-page 実装時に決定する
```

> **注**: `aliasMap` を `getStaticPaths` に渡す具体的な方法 (Astro virtual module 等) は
> def-page・post-page feature の実装時に決定する。

## 実装対象ファイル

| ファイル | 役割 |
|---------|------|
| `src/lib/build/backlink-graph.ts` | `getBacklinkGraph`・`extractConceptLinks`・`resolveLinks` |
| `src/lib/build/backlink-graph.test.ts` | Vitest テスト |
| `src/lib/remark/parse-concept-links.ts` | 共有正規表現 (concept-link feature で定義) |
| `src/pages/defs/[id].astro` | backlink を props として利用 (def-page と合わせて実装) |
| `src/pages/posts/[slug].astro` | 同上 (post-page と合わせて実装) |

## テスト戦略 (Vitest)

**`extractReferences` テスト:**

| ケース | 期待出力 |
|--------|---------|
| `[[term]]` が含まれる | term 文字列の配列 |
| `::embed[term]` が含まれる | term 文字列の配列 (同等扱い) |
| `[[#id]]` が含まれる | 除外される |
| `[[term]]` と `::embed[term]` が混在 | 両方抽出される |
| 参照なし | 空配列 |

**`resolveLinks` テスト:**

| ケース | 期待出力 |
|--------|---------|
| alias-map で解決できる | canonical id の配列 |
| 未解決の term | 除外される |
| alias 経由で解決 | canonical id に正規化される |

**`getBacklinkGraph` テスト:**

実ファイルシステムへのアクセスはモックして検証する。

| ケース | 期待出力 |
|--------|---------|
| Post から Definition を参照 | `type: 'post'` のエントリが追加される |
| Definition から Definition を参照 | `type: 'definition'` のエントリが追加される |
| 同じ Definition を複数回参照 | backlink は重複しない |
| 未解決の `[[term]]` | backlink に含まれない |
| キャッシュ | 2 回目の呼び出しはスキャンをスキップ |

## エッジケース

| ケース | 挙動 |
|--------|------|
| `[[term]]` 未解決 | 無視 (backlink に追加しない) |
| `::embed[term]` 未解決 | 無視 (backlink に追加しない) |
| `[[#id]]` ローカル参照 | 無視 |
| 自己参照 (Definition が自分自身を参照) | backlink に含まれる (除外しない) |
| ローカル定義 id と global id が重複 | alias-map による解決 (ローカル id は alias-map に含まれない) |

## 未決事項

- `aliasMap` を `getStaticPaths` に渡す具体的な方法 (Astro virtual module 等) は def-page・post-page 実装時に決定する
