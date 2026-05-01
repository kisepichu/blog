# preview-index

## 概要

全 Definition の definition_block HTML をビルド時に収集し、`public/preview-index.json` として出力する。
hover-preview が実行時にこれを参照して popup の中身を描画する。

`embed-definition` feature の `defContentMap` (共有インフラ) から生成するため、
remark パイプラインを再実行せず `writePreviewIndex` を呼ぶだけでよい。

## 出力フォーマット

```ts
// public/preview-index.json
type PreviewIndex = Record<string, PreviewEntry>

interface PreviewEntry {
  title: string   // Definition の frontmatter.title
  html: string    // definition_block の innerHTML (外側の div は含まない)
}
```

```json
{
  "poset": {
    "title": "半順序集合",
    "html": "<p><strong>半順序集合</strong> (poset) とは、集合 $P$ と...</p>"
  }
}
```

`html` は `<div class="definition-block">` の **内側** の HTML。
hover-preview 側がコンテナ div を用意して `innerHTML` にセットするため、外側の div は不要。

数式 (`$...$`) は HTML にそのまま含む。MathJax はクライアントサイドで `typesetPromise` を実行する。

## 生成タイミング・場所

`astro:config:setup` フック内で `defContentMap` 構築直後に生成する。
`getStaticPaths` での生成は不要。

```ts
// astro.config.ts — integration フック内
const defContentMap = await buildDefContentMap(defs, aliasMap, defMetaMap, baseUrl)

writePreviewIndex(defContentMap, 'public/preview-index.json')
// ↑ defContentMap をそのまま JSON 化して書き出すだけ
```

## defContentMap との関係

`defContentMap` は `embed-definition` feature の `src/lib/build/def-content-map.ts` で構築する。
preview-index は **この map を JSON として書き出すだけ**。独自の remark 処理は行わない。

```ts
// src/lib/build/preview-index.ts
import { writeFileSync } from 'node:fs'
import type { DefContentMap } from './def-content-map'

export function writePreviewIndex(defContentMap: DefContentMap, path: string): void {
  writeFileSync(path, JSON.stringify(defContentMap))
}
```

`extractDefinitionBlockHtml` も `def-content-map.ts` 側で使用されるため、
preview-index は独立した remark 処理ロジックを持たない。

## ビルド警告

`:::definition` が 0 個の Definition ファイルに対するビルド警告は `buildDefContentMap` (embed-definition) 側で発出する。
preview-index はその結果を受け取るだけのため、追加の警告処理は不要。

## 実装対象ファイル

| ファイル | 役割 |
|---------|------|
| `src/lib/build/preview-index.ts` | `writePreviewIndex` |
| `src/lib/build/preview-index.test.ts` | Vitest テスト |
| `src/lib/build/def-content-map.ts` | `buildDefContentMap`・`extractDefinitionBlockHtml` (embed-definition feature で定義) |
| `astro.config.ts` | integration フックでの呼び出し (embed-definition と同箇所) |

## テスト戦略 (Vitest)

**`writePreviewIndex` テスト:**

`writeFileSync` をモックして JSON 内容を検証する。実ファイルシステムへの書き込みは行わない。

| ケース | 期待出力 |
|--------|---------|
| 正常な defContentMap | 各 id をキーに title・html が入る JSON |
| 空の defContentMap | `{}` |

`extractDefinitionBlockHtml` のテストは `def-content-map.test.ts` に記述する (embed-definition 参照)。

## エッジケース

| ケース | 挙動 |
|--------|------|
| `:::definition` 0 個の Definition | `buildDefContentMap` 側で除外済みのため、preview-index には含まれない |
| `:::definition` 複数 | 先頭のみ抽出 (`buildDefContentMap` 側で処理済み) |
| 数式 (`$...$`) を含む | HTML にそのまま含む (MathJax はクライアントサイド) |
| `definition-block` の中に `[[term]]` | concept-link として HTML に変換済みの状態で含まれる |

## 未決事項

なし
