# 仕様書

壁打ちをもとに確定した仕様をまとめたもの。未決事項は末尾の Q リストに記載。

---

## ドメインモデル

ドメインは **Post**・**Definition**・**Series** の 3 種類。

### Definition

1 ページ 1 概念。`content/defs/<id>.md` に配置する。

**frontmatter:**

```yaml
id: poset # URL・参照キー。ファイル名と一致させる
title: 半順序集合
english: "partially ordered set" # 英語名。[[term]] リンクの表示に使われる
aliases: [poset, 半順序] # 別名。[[alias]] でも参照可能
status: published # published | draft | scrap
tags: [集合論]
```

**本文構造:**

```markdown
:::definition
**半順序集合** (poset) とは、集合 $P$ と反射的・反対称的・推移的な
二項関係 $\leq$ の組 $(P, \leq)$ である。
:::

補足説明はここに書く。preview・検索には含まれない。
```

- `:::definition` ブロックが **definition_block**。hover preview・検索・一覧表示はすべてこれを対象とする。
- definition_block の外の本文は補足説明として自由に記述できる。

### Series

1 ページ 1 シリーズ。`content/series/<slug>.md` に配置する。

**frontmatter:**

```yaml
title: 型理論入門
description: 単純型付きラムダ計算から依存型まで、型理論の基礎を丁寧に解説するシリーズ。 # 省略可
status: published # published | draft | scrap
```

- slug (ファイル名) が Post の `series` フィールドのキーと対応する
- `title` は home-page の series-card・post-page の series-banner・series-page で使用する
- `description` は series-page のみで表示する
- status は series 自体の公開状態。本番では published のみ `/series/[slug]` が生成される

### Post

通常の記事。`content/posts/<slug>.md` に配置する。定理・証明・局所定義はページ種別としては扱わず、記事内の構造として自由に記述する。

**frontmatter:**

```yaml
title: 型理論入門
date: 2025-04-10    # 省略可 (YYYY-MM-DD)
status: published   # published | draft | scrap
tags: [型理論]
series: type-theory-intro # 省略可
series_order: 1 # series 指定時は必須
```

---

## コンテンツ記法

### 概念リンクと Hover Preview【目玉機能】

`[[term]]` 記法で global Definition へのリンクを記述する。リンクにカーソルを合わせると definition_block がその場に表示される (hover preview)。数式・導出図を含めてレンダリングされる。

```markdown
[[半順序集合]] において [[上界]] が存在するとは限らない。
<!-- [[解決キー|表示テキスト]] 記法は将来予定。現状は [[term]] のみ対応。 -->
```

hover で「半順序集合」の上にカーソルを乗せると、その場で definition_block が展開される:

```
┌─────────────────────────────────────────────┐
│ 半順序集合 (poset)                           │
│                                             │
│ 集合 P と反射的・反対称的・推移的な二項関係 │
│ ≤ の組 (P, ≤) を半順序集合という。         │
└─────────────────────────────────────────────┘
```

- `term` は Definition の `id` または `aliases` のいずれかにマッチすれば解決される。alias マッチの場合も href は canonical id を使う (`/defs/<id>`)。リンクテキストは `{title}({english})` 形式で表示される。
- hover 時に preview-index.json から definition_block の HTML を取得し、React island (`HoverPreview`) で描画する。
- global popup (`[[term]]`) は描画後に `MathJax.typesetPromise([element])` を再実行して数式をレンダリングする。local popup (`[[#id]]`) は DOM から取得した MathJax 処理済み HTML を使用するため再実行しない。
- ポップアップはスタック型でネスト可能。ポップアップ内の concept-link も hover preview を起動し、親ポップアップは維持される。
- ローカル定義 (`[[#id]]`) も hover preview の対象。内容は同一ページ上の `:::definition{#id}` ブロックから取得する。
- タッチ端末では長押し (400ms) でポップアップ表示、短タップはリンク遷移。
- Tab フォーカスでもポップアップを表示する。Escape で全ポップアップを閉じる。
- 詳細仕様: `docs/features/hover-preview.md`

### グローバル定義の埋め込み

`::embed[term]` 記法でグローバル Definition の definition_block をページへビルド時に静的展開する。
hover preview とは異なり、ページのコンテンツとして HTML に含まれる。

```markdown
ここで基本概念を定義する。

::embed[poset]

::embed[upper-bound]

以上を踏まえて...
```

- `term` は Definition の `id` または `aliases` のいずれかにマッチすれば解決される。
- 埋め込み順 (上から) に定義番号が振られる (`data-def-number` 属性 + `定義 N` ラベル)。
- 番号スコープはページ内のみ。ローカル定義 (`:::definition{#id}`) も `::embed[term]` も同じカウンターで連番される (AST の上から下の出現順)。
- 埋め込まれた definition_block 内の `[[term]]` リンクも有効 (hover preview が動作する)。
- `::embed[term]` は `[[term]]` と同等の backlink 参照として扱われる。

### ローカル定義

記事内のみで有効な一時的な定義。`:::definition{#id}` で記述する。

```markdown
ここでは写像 $f$ を次のように定める。

:::definition{#local-f}
$f : A \to B$ を...と定義する。
:::

[[#local-f]] を使うと...
```

参照方法:

- `[[#id]]` — 明示的なローカル定義参照 (同一ページ内のみ)
- `[[term]]` — まずローカル定義の id を検索し、なければ global Definition の id/alias を検索する (ローカル優先)

ページ外から参照されない。

### リンク・埋め込み記法一覧

| 記法            | 解決先                                                             | hover preview                       | backlink |
| --------------- | ------------------------------------------------------------------ | ----------------------------------- | -------- |
| `[[term]]`      | ローカル定義 (id 優先) → global Definition (id or alias)           | ローカル定義または definition_block | ✓        |
| `[[#id]]`       | 同一ページのローカル定義のみ (`:::definition{#id}` で定義したもの) | ローカル定義の場合のみ表示          | —        |
| `::embed[term]` | global Definition の definition_block をビルド時展開               | — (本文として埋め込み済み)          | ✓        |

- `[[term]]` は常に Definition (またはローカル定義) の参照。Post へのリンクには使わない。
- 見出しへのページ内リンク・記事間リンクは通常の Markdown (`[text](#heading)`, `[text](/posts/slug)`) を使う。`[[...]]` 記法は Definition 参照専用。

### 数式・導出図

- **数式**: TeX 記法、インライン `$...$` / ブロック `$$...$$`
- **導出図**: bussproofs (prooftree) 記法、MathJax の `bussproofs` 拡張で描画
- レンダラー: MathJax (CDN)、hover preview 内でも再実行される

---

## ページ構成

| URL              | 内容                                               |
| ---------------- | -------------------------------------------------- |
| `/`              | ホーム。hero + 最新記事5件 (post-card with tags/series) + サイドバー (シリーズ一覧・最近の定義4件・タグ一覧)。詳細は `docs/features/home-page.md` |
| `/posts`         | 記事一覧。全記事を日付降順・10件/ページでページネーション表示。詳細は `docs/features/posts.md` |
| `/posts/page/[n]` | 記事一覧 2ページ目以降 (`n` ≥ 2)                  |
| `/posts/[slug]`  | 記事ページ。本文・タグ・series バッジ・series-nav (prev/next)・backlink |
| `/defs/[id]`     | 定義ページ。definition_block・補足・タグ・backlink |
| `/tags/[tag]`    | タグ別記事・定義一覧                               |
| `/series`        | シリーズ一覧。全シリーズをひとつのページに連結表示 (タイトル・説明・記事リスト)。最新記事日付降順。詳細は `docs/features/series-index.md` |
| `/series/[slug]` | シリーズ記事一覧・順序表示。ローカルでは draft 記事も "準備中" バッジ付きで表示。詳細は `docs/features/series-page.md` |

- 記事ページ・定義ページには backlink の下に giscus コメント欄を表示する。詳細は `docs/features/giscus.md`

- Definition の URL は `/defs/[id]` のみ。aliases によるリダイレクトは設けない。
- 記事ページ内の series ナビ (prev/next リンク) も表示する。
- 共有コンポーネント (Layout, Breadcrumb, TagBadge, Backlinks) は `src/components/` に置き def-page ブランチで整備する。
- タグ色は `src/config/tag-colors.json` で著者が指定できる。未指定タグはハッシュ値で 5 色のパステルパレットから自動割り当て。
- タグ URL は raw タグ名をそのまま使用する (`/tags/集合論`)。encodeURIComponent は使わない。

---

## ビルドパイプライン

独自 AST は持たない。Astro のコンテンツコレクション + remark/rehype プラグインで実現する。

### 事前処理: alias map 構築

remark プラグインより先に `content/defs/` を全スキャンして alias map を構築する。

```ts
// { "半順序": "poset", "poset": "poset", ... }
type AliasMap = Record<string, string>; // alias/id → canonical id
```

Astro integration の `astro:config:setup` フックで一括構築し、`remarkPlugins` と backlink ビルダーの両方に渡す:

```ts
// astro.config.ts (integration hook 内)
const isProd = process.env.NODE_ENV === "production";
const allDefs = scanDefsDirectory("content/defs/");
const defs = isProd ? allDefs.filter((d) => d.status === "published") : allDefs;
const aliasMap = buildAliasMap(defs); // alias/id → canonical id
const defMetaMap = buildDefMetaMap(defs); // canonical id → { title, english }
const baseUrl = config.base ?? "/";
const defContentMap = await buildDefContentMap(defs, aliasMap, defMetaMap, baseUrl);
// canonical id → { title, html }

// preview-index.json をここで生成
writePreviewIndex(defContentMap, "public/preview-index.json");

// remarkPlugins に注入
config.markdown.remarkPlugins.push(
  [remarkConceptLink, { aliasMap, defMetaMap, baseUrl }],
  [remarkEmbedDefinition, { defContentMap, aliasMap }],
);
```

本番ビルド時は draft/scrap の Definition を alias map・defContentMap から除外する。

### remark/rehype プラグイン (per-file)

実行順:

1. **remark-definition-block**: `:::definition` → `<div class="definition-block">` (remark-directive 利用)
2. **remark-local-definition**: `:::definition{#id}` → `<div class="definition-block" id="...">` + `file.data.localIds` を設定
3. **remark-concept-link**: alias map・defMetaMap・`baseUrl` を受け取り、`[[term]]` を変換する
   - 解決成功: `<a class="concept-link" data-term="<canonical-id>" href="<baseUrl>/defs/<canonical-id>">{title}({english})</a>`
   - 解決失敗 (開発時): `<a class="concept-link concept-link--unresolved" ...>term</a>` (赤枠等で視覚的に明示)
   - 解決失敗 (本番): プレーンテキストとして出力 + ビルド警告。ビルドは止めない。
4. **remark-embed-definition**: `::embed[term]` → definition_block を静的展開・定義番号付与

**URL 生成の経路:**

- remark プラグイン (ビルド時 Node.js): `config.base` を integration から注入して使用
- クライアントサイド JS (hover preview 等): `import.meta.env.BASE_URL` を使用

### ビルド時生成物 (cross-file)

`astro:config:setup` フックで生成:

- **preview-index.json** (`public/preview-index.json`): `{ [id]: { html: "...", title: "..." } }` — 全 Definition の definition_block HTML (defContentMap から生成)

`getStaticPaths` 内で生成:

- **backlink グラフ**: alias map を使って `[[term]]` と `::embed[term]` を canonical id に正規化しながら全ファイルをスキャンし、各ページの backlink 一覧を生成してページ props に渡す

### 検索インデックス

Pagefind を使用。`pnpm build` (`astro build && pagefind --site dist`) でインデックスを生成。詳細仕様: `docs/features/search.md`

- **ヘッダー検索ボックス**: `Layout.astro` のナビ内。Enter で `/search?q=<query>` に遷移
- **`/search` ページ**: React island `SearchInterface` が Pagefind JS API を動的インポートして検索・結果表示
- **prefix filter**: `#tag` でタグ候補ドロップダウン、`@` で type 候補 (post / definition) — Pagefind の `filters()` API を利用
- **フィルタ属性**: `data-pagefind-filter` (フィルタ用) + `data-pagefind-meta` (表示メタ用) を各ページに付与
  - タグは `<span data-pagefind-filter="tags:{tag}">` を 1 タグ 1 要素で付与 (カンマ区切りにしない)
- **Definition ページ**: `data-pagefind-body` を definition_block にのみ付与 (`remark-definition-block.ts` で生成する div に属性追加)。補足本文は `data-pagefind-body` の外になるため自動的にインデックス対象外となる

---

## 技術スタック

| 項目                   | 選択                                     |
| ---------------------- | ---------------------------------------- |
| フレームワーク         | Astro v6                                 |
| UI コンポーネント      | React (Astro island)                     |
| 言語                   | TypeScript                               |
| パッケージマネージャー | pnpm                                     |
| スタイリング           | CSS Modules                              |
| 数式レンダラー         | MathJax (CDN) + bussproofs 拡張          |
| 検索                   | Pagefind                                 |
| コメント               | giscus (GitHub Discussions)              |
| Markdown 拡張          | remark-directive                         |
| ホスティング           | GitHub Pages                             |
| CI/CD                  | GitHub Actions (main push でデプロイ)    |

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

| status      | ローカルビルド | 本番ビルド |
| ----------- | -------------- | ---------- |
| `published` | 表示           | 表示       |
| `draft`     | 表示           | **除外**   |
| `scrap`     | 表示           | **除外**   |

切り替えは `import.meta.env.PROD` で行う。`astro build` 時は `PROD = true`、`astro dev` 時は `PROD = false`。`getStaticPaths` および content collection のクエリで以下のようにフィルタリングする:

```ts
const entries = await getCollection("posts");
const visible = import.meta.env.PROD
  ? entries.filter((e) => e.data.status === "published")
  : entries;
```

**e2e 用 override**: 環境変数 `DRAFT_VISIBLE=1` が設定されている場合、本番ビルド相当 (`import.meta.env.PROD = true`) であっても `draft` / `scrap` を除外しない。Playwright の `webServer` コマンドで `DRAFT_VISIBLE=1 pnpm build` として使用する。実装は `src/config/env.ts` の `FILTER_DRAFTS` および `astro.config.ts` の `contentPipelineIntegration` で管理する。

---

## 未決事項 (Q リスト)

- ~~ホームページの詳細レイアウト~~ → 確定: 最新5件・サイドバー形式 (`docs/features/home-page.md`)
- ~~記事一覧ページ (`/posts`) の要否~~ → 確定: 実装する。10件/ページ、日付降順 (`docs/features/posts.md`)
- Definition 一覧ページ (`/defs`) の要否
- タグ一覧ページ (`/tags`) の要否
- ~~本番ブランチ運用~~ → 確定: main = 安定公開、develop = 開発。main push で GitHub Pages にデプロイ。執筆は writing 等のブランチで行い main にマージする運用。
- GitHub Pages の base path: 独自ドメインなら `base: '/'`、リポジトリ配下なら `base: '/blog'` 等 (Astro config の `site`/`base` に影響。remark plugin は integration から注入された `config.base`、クライアントサイドは `import.meta.env.BASE_URL` を使う設計のため、決定後に config を埋めるだけでよい)
- alias 重複時: ビルド警告を出し、ファイル id のアルファベット順で先勝ち ← 確定
- `:::definition` が 0 個の場合: ビルド警告、そのページの preview と検索インデックスはなし ← 確定
- `:::definition` が複数ある場合: 先頭の 1 つのみ definition_block として扱い、残りは通常ブロックとして描画 + ビルド警告 ← 確定
- `[[term]]` が未解決の場合: 開発時は視覚的 broken リンク、本番は警告 + プレーンテキスト出力 (ビルドは止めない) ← 確定
- タグ URL のエンコード規則 (日本語タグをそのまま URL に使うか slug 化するか)
- ~~hover preview のタッチ端末・キーボード操作・閉じ方・遅延表示仕様~~ → 確定 (`docs/features/hover-preview.md`)
