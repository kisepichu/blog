# def-page

## 概要

`/defs/[id]` 定義ページ。Definition の definition_block・補足説明・タグ・バックリンクを表示する。

**このブランチ (feat/phase-2-def-page) で共有コンポーネントと CSS トークンも整備する。**

---

## ページ構成

```
[sticky header: $ kise.dev  |  home posts defs series]

container--narrow (max-width: 720px, padding: 2.5rem 1.25rem)
  [Breadcrumb: Home › Defs › 半順序集合]

  [def-header]
    "定義 / DEFINITION"        ← DotGothic16, 0.68rem, accent color, uppercase, letter-spacing 0.12em
    h1: 半順序集合             ← 1.55rem
    [def-meta]
      [id-badge: poset]        ← JetBrains Mono, 0.78rem, surface bg, border
      [partially ordered set]  ← text-muted, font-ui, 0.75rem (frontmatter.english)
      [別名: 半順序]             ← text-muted, font-ui, 0.75rem (aliases から id・title・english を除いた一覧)
      [#集合論 tag]             ← TagBadge コンポーネント

  [definition-block]           ← CSS: teal border 1.5px, accent-bg, border-radius 8px
    ▶ 定義                     ← ::before pseudo-element (font-ui, 0.68rem, accent-dim)
    <rendered def content>     ← .prose スタイル、0.95rem

  [supplement]                 ← 補足説明がある場合のみ
    border-top セパレータ
    <rendered supplement>      ← .prose スタイル

  [backlinks]                  ← バックリンクがある場合のみ
    ← バックリンク             ← font-ui, 0.72rem, text-faint, uppercase
    [def] 束                  ← teal badge
    [post] 型理論入門…        ← lavender badge

[footer: © 2026 kise | Built with Astro · React · MathJax]
```

---

## 共有コンポーネント (このブランチで作成)

| コンポーネント | ファイル | 役割 |
|---|---|---|
| Layout | `src/components/Layout.astro` | sticky header + footer + `<slot />` + MathJax CDN script |
| Breadcrumb | `src/components/Breadcrumb.astro` | パンくずリスト (items 配列を props で受け取る) |
| TagBadge | `src/components/TagBadge.astro` | タグ色付きバッジ (色は `getTagColor()` で解決) |
| Backlinks | `src/components/Backlinks.astro` | バックリンク一覧 (BacklinkGraph 型の props) |

### Layout props

```ts
interface Props {
  title: string        // <title> タグ用
  siteTitle?: string   // ヘッダーロゴ表示名 (デフォルト: "kise.dev")
  activePage?: 'home' | 'post' | 'def' | 'series'
}
```

※ サイトタイトル等はすべて暫定。

### Breadcrumb props

```ts
interface BreadcrumbItem {
  label: string
  href?: string   // 省略するとリンクなし (現在ページ)
}
interface Props {
  items: BreadcrumbItem[]
}
```

使用例:
```astro
<Breadcrumb items={[
  { label: 'Home', href: `${base}/` },
  { label: 'Defs', href: `${base}/defs` },
  { label: def.data.title },
]} />
```

### TagBadge props

```ts
interface Props {
  tag: string
  href?: string   // /tags/[tag] へのリンク (省略時はリンクなし)
}
```

タグ色は `getTagColor(tag)` で解決 (後述)。

### Backlinks props

```ts
// src/lib/build/backlink-graph.ts の型に準ずる
interface BacklinkItem {
  slug: string    // post id または def id
  title: string
  type: 'post' | 'definition'
}
interface Props {
  items: BacklinkItem[]
}
```

---

## CSS 設計

### デザイントークン (`src/styles/tokens.css`)

プロトタイプ HTML から確定した値:

```css
:root {
  /* fonts */
  --font-body: 'M PLUS Rounded 1c', sans-serif;
  --font-ui:   'DotGothic16', monospace;
  --font-code: 'JetBrains Mono', monospace;

  /* surface */
  --bg:        #fafaf8;
  --surface:   #f3f3ef;
  --surface2:  #eaeae5;
  --border:    #d8d8cf;
  --border-l:  #eaeae5;

  /* text */
  --text:       #252520;
  --text-muted: #747468;
  --text-faint: #aeae9e;

  /* accent (terminal teal) */
  --accent:      #3d9e8a;
  --accent-dim:  #287a68;
  --accent-bg:   #ecfaf5;
  --accent-pale: #c4ede4;

  /* link */
  --link:   #4070c8;
  --link-h: #2855a0;

  /* pastel palette */
  --lav:      #8878c8;  --lav-bg:   #f0edf8;  --lav-b:   #ccc4ed;
  --peach:    #c8784a;  --peach-bg: #fdf1e8;  --peach-b: #e8c0a0;
  --rose:     #c84878;  --rose-bg:  #fceef4;  --rose-b:  #f0aac8;
  --sage:     #5a9a6a;  --sage-bg:  #edf6ee;  --sage-b:  #aed8b4;
  --amber:    #a88a28;  --amber-bg: #faf6e0;  --amber-b: #ddd090;

  /* unresolved link */
  --unresolved: #d03030;

  /* border-radius */
  --r-sm: 4px;
  --r-md: 8px;
  --r-lg: 12px;
}
```

`tokens.css` は `global.css` から `@import` する。

### 主要 CSS ルール (`src/styles/global.css`)

| セレクタ | 主なスタイル |
|---|---|
| `body` | `font-family: var(--font-body); background: var(--bg); color: var(--text)` |
| `h1,h2,h3,h4,h5,h6` | `font-family: var(--font-ui); line-height: 1.35` |
| `a` | `color: var(--link); text-underline-offset: 2px` |
| `.site-header` | sticky top, 52px, backdrop-filter blur(8px), border-bottom |
| `.site-logo` | `$ kise.dev` ターミナル風ロゴ |
| `.site-nav a` | font-ui, 0.8rem, active 時 accent underline |
| `.container` | max-width: 900px, margin: 0 auto |
| `.container--narrow` | max-width: 720px, margin: 0 auto |
| `.site-footer` | border-top, font-ui, 0.72rem, text-faint |
| `.prose` | 本文 typography (line-height 1.9, p/h2/h3/code/pre スタイル) |
| `.definition-block` | teal border 1.5px, accent-bg, border-radius 8px, padding 1.2rem 1.4rem |
| `.definition-block::before` | `content: "▶ 定義"` または `content: "▶ 定義 (" attr(data-def-title) ")"` label (font-ui, 0.68rem, accent-dim) |
| `.definition-block--embedded` | 同上だが `::before` なし (remark が `<span class="definition-number">` を挿入) |
| `.concept-link` | color: accent-dim, text-decoration dotted |
| `.concept-link--unresolved` | color: unresolved, text-decoration wavy |
| `.breadcrumb` | font-ui, 0.72rem, text-faint, flex gap 0.4rem |
| `.tag` | inline-block, border, border-radius 4px, font-ui, 0.7rem |
| `.backlinks` | border-top, margin-top 2.5rem |
| `.backlink-badge--def` | accent-bg, accent color, accent-pale border |
| `.backlink-badge--post` | lav-bg, lav color, lav-b border |

---

## タグ色システム

### 設定ファイル (`src/config/tag-colors.json`)

著者が任意のタグに色を指定できる:

```json
{
  "型理論":  "lav",
  "集合論":  "sage",
  "代数":    "peach",
  "論理学":  "rose",
  "計算論":  "amber"
}
```

値は `"lav" | "peach" | "rose" | "sage" | "amber"` の 5 種類。

### `getTagColor()` (`src/lib/tag-colors.ts`)

```ts
type PastelKey = 'lav' | 'peach' | 'rose' | 'sage' | 'amber'

interface TagColorVars {
  bg: string      // CSS var 文字列, 例: 'var(--lav-bg)'
  fg: string
  border: string
}

export function getTagColor(tag: string): TagColorVars
```

- `tag-colors.json` にあればそれを使用
- なければ tag 名のハッシュ値 (charCodeAt の合計 % 5) で 5 色を循環

### JSON ファイルの読み込み

`src/lib/tag-colors.ts` から `import tagColorsConfig from '../config/tag-colors.json'` で読み込む。  
TypeScript の `resolveJsonModule` が有効であること (`tsconfig.json` 確認)。

---

## Pagefind 対応

```html
<!-- data-pagefind-meta は同名属性を 1 要素に複数書けないため、別々の hidden span にする -->
<span data-pagefind-meta="type:definition" hidden></span>
<span data-pagefind-meta="tags:集合論" hidden></span>
<span data-pagefind-meta="aliases:poset,半順序" hidden></span>

<!-- def-content 全体を検索対象にする -->
<div class="def-content prose" data-pagefind-body>
  ...rendered definition content...
</div>

<!-- バックリンクは検索対象外 -->
<div data-pagefind-ignore>
  <Backlinks ... />
</div>
```

`data-pagefind-meta` は HTML 属性の重複が無効なため、値ごとに別要素に分ける。

---

## getStaticPaths

```ts
// src/pages/defs/[id].astro
export async function getStaticPaths() {
  const allDefs = await getCollection('defs')
  const defs = import.meta.env.PROD
    ? allDefs.filter(d => d.data.status === 'published')
    : allDefs

  const backlinkGraph = getBacklinkGraph() // src/lib/build/backlink-graph.ts

  return defs.map(def => ({
    params: { id: def.id },
    props: {
      def,
      backlinks: backlinkGraph[def.id] ?? [],
    },
  }))
}
```

`getBacklinkGraph()` は `content/posts/` と `content/defs/` を全スキャンするため、
呼び出しは `getStaticPaths` 内で 1 回のみ (Astro がページ単位で呼ぶので実際は 1 回)。

---

## MathJax

Layout.astro の `<head>` に CDN script を置く:

```html
<script>
window.MathJax = {
  tex: {
    inlineMath: [['$', '$']],
    displayMath: [['$$', '$$']],
    packages: {'[+]': ['bussproofs']},
    tags: 'none'
  },
  options: { skipHtmlTags: ['script','noscript','style','textarea','pre'] },
  loader: { load: ['[tex]/bussproofs'] },
  startup: { typeset: true }   // ← 初期ページは自動 typeset
};
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" crossorigin="anonymous" async></script>
```

hover-preview で再実行する際は `MathJax.typesetPromise([element])` を呼ぶ (Phase 3)。

---

## 実装対象ファイル

| ファイル | 役割 |
|---|---|
| `src/pages/defs/[id].astro` | def-page 本体 |
| `src/components/Layout.astro` | 共有レイアウト (header + footer) |
| `src/components/Breadcrumb.astro` | パンくずリスト |
| `src/components/TagBadge.astro` | タグバッジ |
| `src/components/Backlinks.astro` | バックリンク一覧 |
| `src/styles/tokens.css` | CSS デザイントークン |
| `src/styles/global.css` | リセット・共通スタイル (tokens.css を @import) |
| `src/lib/tag-colors.ts` | `getTagColor()` ユーティリティ |
| `src/config/tag-colors.json` | 著者が管理するタグ色設定 |

---

## テスト戦略

**Vitest (src/lib/)**:

| ケース | 期待出力 |
|---|---|
| `getTagColor('型理論')` — 設定あり | `{ bg: 'var(--lav-bg)', fg: 'var(--lav)', border: 'var(--lav-b)' }` |
| `getTagColor('未知のタグ')` — 設定なし | ハッシュで 5 色のいずれか |
| `getTagColor` が同じ未知タグを 2 回呼ぶ | 同じ色を返す (決定論的) |

**Playwright (e2e)**:

| ケース | 確認内容 |
|---|---|
| `/defs/poset` アクセス | ページタイトル「半順序集合」が表示される |
| definition-block | teal 枠・accent-bg 背景・`▶ 定義 (タイトル)` ラベルが表示される |
| MathJax | `$P$` 等の数式がレンダリングされている |
| タグバッジ | `#集合論` が色付きで表示される |
| バックリンク | 参照元のリンクが表示される |
| Breadcrumb | Home › Defs › 半順序集合 の順で表示される |
| 存在しない id | 404 または Astro のデフォルトエラーページ |

---

## エッジケース

| ケース | 挙動 |
|---|---|
| `aliases` が空 | 別名表示なし |
| `aliases` が `id`・`title`・`english` のみの組み合わせ | 「別名:」行を非表示 (各フィールドは別途表示済み) |
| バックリンクなし | `.backlinks` セクションを非表示 |
| 補足説明なし | `.def-supplement` セクションを非表示 |
| タグなし | タグ行を非表示 |
| `status: draft` (本番) | `getStaticPaths` でフィルタされ 404 |

---

## 未決事項

- サイトタイトル・ナビリンクの最終決定 (暫定: "kise.dev" / home posts defs series)
- `/defs` 一覧ページの要否 (Breadcrumb の "Defs" 部分がリンクになるかどうかに影響)
- タグURL のエンコード規則 (日本語タグをそのまま URL に使うか slug 化するか)
