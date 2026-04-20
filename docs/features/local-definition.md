# local-definition

## 概要

記事内のみ有効なローカル定義。`:::definition{#id}` で定義し、`[[#id]]` または `[[term]]` で参照する。
Global Definition の definition_block と同じビジュアルを持つが、ページ外から参照されない。

## 仕様

### 入力構文 (定義)

```markdown
ここでは写像 $f$ を次のように定める。

:::definition{#local-f}
$f : A \to B$ を...と定義する。
:::

[[#local-f]] を使うと...
```

`remark-directive` の `containerDirective` として解析され、`id` 属性が付く。

### 出力 HTML (定義)

```html
<div class="definition-block" id="local-f">
  <p>$f : A \to B$ を...と定義する。</p>
</div>
```

- `definition-block` クラスを付与 (global definition と同じ見た目)
- `id` 属性でページ内アンカーになる
- スタイリングは `ui-base` で `definition-block` として統一

### 入力構文 (参照)

```markdown
[[#local-f]] を使うと...      ← 明示的なローカル参照
[[local-f]] を使うと...       ← ローカル定義が alias-map より優先される
```

### 出力 HTML (参照)

```html
<a class="concept-link concept-link--local" href="#local-f">local-f</a>
```

- `href`: `#<id>` (ページ内アンカー)
- `data-term` は付与しない (hover-preview 対象外)
- `concept-link--local` クラスで global link と区別

### `[[term]]` 解決優先順位

`remarkConceptLink` に `file.data.localIds` を渡すことで、ローカル id が優先される。

```
[[term]] → localIds に含まれる? → YES: ローカルリンク (href="#id")
                                 → NO: alias-map (global) で解決
```

### パイプライン内の実行順

`concept-link` の仕様と合わせて:

```
remarkParse
  → remarkDirective
  → remarkDefinitionBlock   (:::definition を処理、{#id} 付きはスキップ)
  → remarkLocalDefinition   (:::definition{#id} を処理、localIds を file.data に設定)
  → remarkConceptLink       (localIds を参照しながら [[term]] / [[#id]] を解決)
  → remarkRehype
```

`remarkLocalDefinition` が先に走り `file.data.localIds: Set<string>` を設定するため、
`remarkConceptLink` はこれを読み取ってローカル優先で解決できる。

```ts
// remark-local-definition.ts
file.data.localIds ??= new Set<string>()
// :::definition{#id} を見つけるたびに追加
(file.data.localIds as Set<string>).add(id)
```

### `[[#id]]` の解決

`#` で始まる term は `remarkConceptLink` が特別扱いする (concept-link 仕様参照)。
`localIds` に含まれていれば `concept-link--local` として変換、なければ未解決として扱う。

見出しへのアンカーリンク (`[[#heading]]`) は `local-definition` の対象外。
通常の Markdown リンク (`[text](#heading)`) を使うこと。

## 実装対象ファイル

| ファイル | 役割 |
|---------|------|
| `src/lib/remark/remark-local-definition.ts` | プラグイン本体・localIds 収集 |
| `src/lib/remark/remark-local-definition.test.ts` | Vitest テスト |
| `src/lib/remark/remark-concept-link.ts` | `file.data.localIds` を参照する対応 (concept-link 側の実装範囲) |

## テスト戦略 (Vitest)

パイプラインテスト (definition-block・concept-link と統合):

| ケース | 期待出力 |
|--------|---------|
| 基本: `:::definition{#id}` | `<div class="definition-block" id="id">` |
| `[[#id]]` 参照 | `<a class="concept-link concept-link--local" href="#id">` |
| `[[term]]` でローカル優先 | ローカルリンクとして解決 |
| `[[term]]` がローカルにない | global alias-map で解決 |
| 同一ページに複数ローカル定義 | すべて収集・解決 |

## エッジケース

| ケース | 挙動 |
|--------|------|
| ローカル定義 id が global id と重複 | ローカルが優先 |
| `[[#id]]` で id が存在しない | `concept-link--unresolved` (開発) / プレーンテキスト (本番) |
| ページ外からの `[[term]]` でローカル id と同名 | global alias-map で解決 (ローカル id は alias-map に含まれない) |
| `[[#heading]]` (見出しアンカー) | スキップ。通常 Markdown リンクを使うこと |

## 未決事項

なし
