# ogp

## 概要

記事ページ (`/posts/[slug]`) と定義ページ (`/defs/[id]`) に OGP メタタグと OGP 画像を付与する。
OGP 画像はビルド時に Satori + resvg で PNG として自動生成する。

---

## 対象ページ

| ページ | OGP 画像 | og:type |
|---|---|---|
| `/posts/[slug]` | 個別生成 | `article` |
| `/defs/[id]` | 個別生成 | `article` |
| その他 (home, /posts 一覧 etc.) | なし (og タグも付与しない) | — |

---

## OGP メタタグ

Layout.astro の `<head>` に以下を追加する。

```html
<!-- Open Graph -->
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="{canonicalUrl}" />
<meta property="og:image" content="{ogImageUrl}" />
<meta property="og:site_name" content="kisen.one" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{description}" />
<meta name="twitter:image" content="{ogImageUrl}" />
```

### Layout props の拡張

```ts
interface Props {
  title: string
  description?: string   // 追加
  ogImage?: string       // 追加: 絶対 URL。指定時のみ OGP タグを出力する
  siteTitle?: string
  activePage?: 'home' | 'post' | 'def' | 'series' | 'search'
  pagefindIgnore?: boolean
}
```

- `ogImage` が `undefined` の場合は OGP タグ一式を出力しない (一覧ページ等)。
- `canonicalUrl` は `Astro.site` + `Astro.url.pathname` から Layout 内で自動計算する。

---

## og:description の解決ルール

### Post

1. frontmatter `description` フィールドがあればその値を使う。
2. なければ本文 Markdown の先頭 120 文字 (プレーンテキスト化後) を使う。

### Definition

`def.body` (生 Markdown) の先頭 120 文字を `extractDescription` でプレーンテキスト化して使う。
frontmatter に `description` フィールドは持たない。

### 共通

- 120 文字を超える場合は末尾に `…` を付与する。
- テキスト抽出は `src/lib/build/extract-description.ts` として実装する (純粋関数、テスト可能)。
- `extractDescription` は以下の構造を除去してプレーンテキスト化する:
  - ブロック: `:::directive ... :::` / コードフェンス / `$$ ... $$` (数式ブロック) / `::embed[term]` / Markdown 見出し (`## ...`)
  - `[[concept-link]]` → 内側テキストに置換 (語を保持)
  - インライン: HTML タグ / `$...$` (インライン数式) / `**bold**` / `*italic*` / `` `code` ``
  - 連続する空白は 1 つに正規化し、前後の空白を trim する
- 空文字になった場合は `og:description` / `twitter:description` タグを出力しない (`Layout.astro` の `description && ...` 条件による)

---

## OGP 画像生成

### 技術

| ライブラリ | 役割 |
|---|---|
| `satori` | JSX (React) → SVG |
| `@resvg/resvg-js` | SVG → PNG |

### 画像サイズ

1200 × 630 px (OGP 標準)

### 生成タイミング

Astro の静的エンドポイントとしてビルド時に生成する。

```
src/pages/ogp/posts/[slug].png.ts  → /ogp/posts/<slug>.png
src/pages/ogp/defs/[id].png.ts     → /ogp/defs/<id>.png
```

### ogImage URL

```
{Astro.site}/ogp/posts/<slug>.png
{Astro.site}/ogp/defs/<id>.png
```

### フォント

Satori はローカルフォントファイルを要求する。以下を使用する:

| 用途 | フォント | ファイル |
|---|---|---|
| タイプラベル・タイトル | DotGothic16 | `src/assets/fonts/DotGothic16-Regular.ttf` |
| 補助テキスト (英語名・タグ等) | M PLUS Rounded 1c | `src/assets/fonts/MPLUSRounded1c-Regular.ttf` |

- フォントファイルは `src/assets/fonts/` に配置し、git 管理する。
- Google Fonts からの手動ダウンロードまたは npm パッケージ (`@fontsource/*`) 経由で取得する。
- `src/pages/ogp/` エンドポイント内で `fs.readFileSync` でフォントを読み込み、Satori に渡す。

---

## OGP 画像デザイン

### Post

```
┌─────────────────────────────────────────────────────┐
│                                          kisen.one  │
│                                                     │
│  POST                                               │
│                                                     │
│  型理論入門                                          │
│                                                     │
│  2025-04-10    #型理論  #計算論                      │
└─────────────────────────────────────────────────────┘
```

| 要素 | フォント | サイズ | カラー |
|---|---|---|---|
| `POST` ラベル | DotGothic16 | 20px | `#3d9e8a` (accent) |
| タイトル | DotGothic16 | 52px | `#252520` (text) |
| 日付 | DotGothic16 | 18px | `#aeae9e` (text-faint) |
| タグ | DotGothic16 | 18px | `#8878c8` (lav) |
| `kisen.one` | DotGothic16 | 16px | `#aeae9e` (text-faint) |
| 背景 | — | — | `#fafaf8` (bg) |

### Definition

```
┌─────────────────────────────────────────────────────┐
│                                          kisen.one  │
│                                                     │
│  DEFINITION                                         │
│                                                     │
│  半順序集合                                          │
│  partially ordered set                              │
│                                                     │
│  #集合論                                             │
└─────────────────────────────────────────────────────┘
```

| 要素 | フォント | サイズ | カラー |
|---|---|---|---|
| `DEFINITION` ラベル | DotGothic16 | 20px | `#3d9e8a` (accent) |
| タイトル (日本語) | DotGothic16 | 52px | `#252520` |
| 英語名 | M PLUS Rounded 1c | 24px | `#747468` (text-muted) |
| タグ | DotGothic16 | 18px | `#8878c8` |
| `kisen.one` | DotGothic16 | 16px | `#aeae9e` |
| 背景 | — | — | `#fafaf8` |

タイトルが長い場合は自動折り返し (Satori の `flexWrap` で対応)。

---

## コンテンツスキーマ変更

### Post frontmatter に `description` を追加

```ts
// src/content.config.ts
description: z.string().optional(),
```

```yaml
# 使用例 (省略可)
title: 型理論入門
description: 単純型付きラムダ計算から System F までを直感的に解説する記事。
```

省略時は本文冒頭 120 文字を自動抽出する。

---

## 実装ファイル

| ファイル | 役割 |
|---|---|
| `src/components/Layout.astro` | `ogImage` / `description` props 追加、OGP タグ出力 |
| `src/pages/ogp/posts/[slug].png.ts` | Post OGP 画像エンドポイント |
| `src/pages/ogp/defs/[id].png.ts` | Definition OGP 画像エンドポイント |
| `src/lib/build/extract-description.ts` | description 抽出ユーティリティ |
| `src/lib/ogp/render-post-image.tsx` | Post 用 Satori JSX テンプレート |
| `src/lib/ogp/render-def-image.tsx` | Definition 用 Satori JSX テンプレート |
| `src/assets/fonts/DotGothic16-Regular.ttf` | Satori 用フォント |
| `src/assets/fonts/MPLUSRounded1c-Regular.ttf` | Satori 用フォント |
| `src/content.config.ts` | Post に `description` フィールドを追加 |

---

## エッジケース

| ケース | 挙動 |
|---|---|
| `description` なし + 本文が空 | `extractDescription` が空文字を返す。`Layout.astro` の `description && ...` 条件により `og:description` / `twitter:description` タグを出力しない |
| タイトルが長い (30 文字超) | Satori の自動折り返しに委ねる。最大 3 行程度を想定 |
| タグが多い | `flexWrap: 'wrap'` で複数行に折り返す |
| `english` が長い | 1 行で収まらない場合は折り返し |
| `Astro.site` 未設定 | `canonicalUrl` および `ogImageUrl` 生成をスキップし、OGP タグを出力しない |
| `status: draft` (本番) | そもそもページが生成されないため OGP 画像も生成されない |

---

## 検証

### Vitest (src/lib/)

| テスト | 期待 |
|---|---|
| `extractDescription('...長い本文...')` | 120 文字でカットして `…` を付与 |
| `extractDescription('')` | 空文字を返す |
| description が frontmatter にある Post | frontmatter 値をそのまま返す |
| definition_block に HTML タグが含まれる場合 | タグを除去したプレーンテキストを返す |

### Playwright (e2e)

| ケース | 確認内容 |
|---|---|
| Post ページ | `<meta property="og:image">` が `/ogp/posts/<slug>.png` を指している |
| Post ページ | `<meta property="og:description">` に内容がある |
| Def ページ | `<meta property="og:image">` が `/ogp/defs/<id>.png` を指している |
| Home ページ | OGP タグが存在しない |
| OGP 画像 URL | 実際に 200 レスポンス・PNG として返る |

---

## 未決事項

- タグ省略のしきい値 (何個まで表示するか) → 実装時に見た目で調整
- フォントの取得方法: 手動 DL か `@fontsource` npm パッケージか
- Post ページの `og:article:published_time` (ISO 8601) を付与するか
