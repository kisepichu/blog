# 仕様書

壁打ちをもとに確定した仕様をまとめたもの。未決事項は末尾の Q リストに記載。

---

## ドメインモデル

ドメインは **Post** と **Definition** の 2 種類のみ。

### Definition

1 ページ 1 概念。`content/defs/<id>.md` に配置する。

**frontmatter:**

```yaml
id: lambda-calculus          # URL・参照キー。ファイル名と一致させる
title: λ計算
aliases: [ラムダ計算, lambda calculus]   # 別名。[[alias]] でも参照可能
status: published            # published | draft | scrap
tags: [型理論, 計算モデル]
```

**本文構造:**

```markdown
:::definition
**λ計算**とは、関数の抽象・適用を形式化した計算モデルである。
$$\lambda x. M$$
:::

補足説明はここに書く。preview・検索には含まれない。
```

- `:::definition` ブロックが **definition_block**。hover preview・検索・一覧表示はすべてこれを対象とする。
- definition_block の外の本文は補足説明として自由に記述できる。

### Post

通常の記事。`content/posts/<slug>.md` に配置する。定理・証明・局所定義はページ種別としては扱わず、記事内の構造として自由に記述する。

**frontmatter:**

```yaml
title: 型理論入門
status: published            # published | draft | scrap
tags: [型理論]
series: type-theory-intro    # 省略可
series_order: 1              # series 指定時は必須
```

---

## コンテンツ記法

### 概念リンクと Hover Preview【目玉機能】

`[[term]]` 記法で global Definition へのリンクを記述する。リンクにカーソルを合わせると definition_block がその場に表示される (hover preview)。数式・導出図を含めてレンダリングされる。

```markdown
[[λ計算]] の基本操作は α 変換と [[β簡約]] である。
```

- `term` は Definition の `id` または `aliases` のいずれかにマッチすれば解決される。
- hover 時に preview-index.json から definition_block の HTML を取得し、React island で描画する。
- 描画後に `MathJax.typesetPromise([element])` を再実行して数式をレンダリングする。

### ローカル定義

記事内のみで有効な一時的な定義。`:::definition{#id}` で記述し、`[[#id]]` で参照する。

```markdown
ここでは写像 $f$ を次のように定める。

:::definition{#local-f}
$f : A \to B$ を...と定義する。
:::

[[#local-f]] を使うと...
```

- ページ外から参照されない。
- `[[term]]` で global と local に同名が存在する場合、ローカルを優先する。

### リンク記法一覧

| 記法 | 解決先 | hover preview |
|------|--------|---------------|
| `[[term]]` | global Definition (id or alias) | definition_block |
| `[[#anchor]]` | 同一ページのローカル定義または見出し | ローカル定義の場合のみ表示 |
| `[[post-id#anchor]]` | 別記事の特定箇所 | なし |
| `[[post-id]]` | 別記事 | なし |

ページ内リンクは通常の `#anchor`、記事同士のリンクは通常の Markdown リンクも使用可。

### 数式・導出図

- **数式**: TeX 記法、インライン `$...$` / ブロック `$$...$$`
- **導出図**: bussproofs (prooftree) 記法、MathJax の `bussproofs` 拡張で描画
- レンダラー: MathJax (CDN)、hover preview 内でも再実行される

---

## ページ構成

| URL | 内容 |
|-----|------|
| `/` | ホーム。最新記事一覧・シリーズ一覧 |
| `/posts/[slug]` | 記事ページ。本文・タグ・series ナビ・backlink |
| `/defs/[id]` | 定義ページ。definition_block・補足・タグ・backlink |
| `/tags/[tag]` | タグ別記事・定義一覧 |

- Definition の URL は `/defs/[id]` のみ。aliases によるリダイレクトは設けない。
- series ページ (`/series/[slug]`) は将来拡張として保留。記事ページ内の series ナビ (prev/next) は MVP に含む。

---

## ビルドパイプライン

独自 AST は持たない。Astro のコンテンツコレクション + remark/rehype プラグインで実現する。

### remark/rehype プラグイン (per-file)

1. **remark-definition-block**: `:::definition` → definition_block ノード (remark-directive を利用)
2. **remark-concept-link**: `[[term]]` → `<a class="concept-link" data-term="term" href="/defs/term">term</a>`

### ビルド時生成物 (cross-file)

`getStaticPaths` 内で全コンテンツを横断して生成する。

- **preview-index.json** (`public/preview-index.json`): `{ [id]: { html: "...", title: "..." } }` — 全 Definition の definition_block HTML
- **backlink グラフ**: 全ファイルの raw body を `[[term]]` 正規表現でスキャンし、各ページの backlink 一覧を生成してページ props に渡す

### 検索インデックス

Pagefind を使用。ビルド後に自動生成。各ページに `data-pagefind-meta` で `type` (post/definition)・`tags`・`series`・`aliases` を付与し、フィルタリングに対応する。

---

## 技術スタック

| 項目 | 選択 |
|------|------|
| フレームワーク | Astro v5 |
| UI コンポーネント | React (Astro island) |
| 言語 | TypeScript |
| パッケージマネージャー | pnpm |
| スタイリング | CSS Modules |
| 数式レンダラー | MathJax (CDN) + bussproofs 拡張 |
| 検索 | Pagefind |
| Markdown 拡張 | remark-directive |
| ホスティング | GitHub Pages |
| CI/CD | GitHub Actions (develop push でデプロイ) |

---

## UI 方針

- **カラー**: パステルカラーを基調。ターミナル風のアクセントカラー。
- **フォント**:
  - 本文・日本語: M PLUS Rounded 1c (丸ゴシック等幅、Google Fonts)
  - UI・見出し: DotGothic16 (ドットフォント、ターミナル感、Google Fonts)
  - コードブロック: JetBrains Mono (Google Fonts)
  - 数式: MathJax 内蔵フォント (STIX Two / TeX Gyre)
- **組版**: 数学書的なレイアウト。definition_block は太字・枠で強調。余白・行間を広めに取る。
- **レスポンシブ**: モバイル対応。

---

## status の扱い

| status | ローカルビルド | 本番ビルド |
|--------|--------------|-----------|
| `published` | 表示 | 表示 |
| `draft` | 表示 | **除外** |
| `scrap` | 表示 | **除外** |

ローカルビルドでは全 status を表示する。本番ビルド (GitHub Actions) では `published` のみをビルド対象とする。

---

## 未決事項 (Q リスト)

- series 専用ページ (`/series/[slug]`) の要否と内容
- ホームページの詳細レイアウト (最新記事の件数、シリーズ一覧の表示形式)
- Definition 一覧ページ (`/defs`) の要否
- タグ一覧ページ (`/tags`) の要否
- 本番ブランチ運用 (develop 以外のブランチでの執筆フロー詳細)
