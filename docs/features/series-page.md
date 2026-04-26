# series-page

## 概要

`/series/[slug]` シリーズページ。シリーズに属する記事を順番に一覧表示する。

**このブランチ (feat/phase-2-series-page) で以下をすべて実装する:**

- `content/series/` コレクション追加 (Series ドメイン定義は `docs/spec.md` を参照)
- `/series/[slug]` ページ新規作成
- series-nav (post-page への prev/next ナビ追加)
- home-page・post-page の series タイトル暫定表示 → 正式タイトルに差し替え

---

## Series コレクション

`content/series/<slug>.md` に配置する。slug = ファイル名 = Post の `series` フィールドの値。

**frontmatter:**

```yaml
title: 型理論入門
description: 単純型付きラムダ計算から依存型まで、型理論の基礎を丁寧に解説するシリーズ。 # 省略可
status: published # published | draft | scrap
```

- `title`: 必須。home-page の series-card・post-page の series-banner で使用する
- `description`: 省略可。series-page のみで表示
- `status`: series 自体の公開状態。本番では published のみ `/series/[slug]` が生成される

**スキーマ (`src/content.config.ts` に追加):**

```ts
const series = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/series' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(['published', 'draft', 'scrap']).default('draft'),
  }),
})
```

---

## ページ構成

```
[sticky header]

container--narrow (max-width: 720px, padding: 2.5rem 1.25rem)
  [Breadcrumb: Home › Series › 型理論入門]
    ※ "Series" は plain text (シリーズ一覧ページは実装しない)

  [series-header]
    div.series-page__label   "シリーズ"
    h1.series-page__title    {series.data.title}
    {description && <p>...}  ← text-muted, 0.9rem, margin-bottom 1.5rem

  <ol class="series-post-list">
    {posts.map(post => (
      <li class="series-post-item [series-post-item--draft]"
          onClick={post.isClickable ? navigate : undefined}>
        <span class="series-post-num">01</span>
        <div>
          <span class="series-post-title">{post.data.title}</span>
          {post.isDraft && <span class="upcoming-badge">準備中</span>}
        </div>
      </li>
    ))}
  </ol>

[footer]
```

---

## 記事リスト

- `series_order` 昇順で表示
- **本番** (`import.meta.env.PROD`):
  - `status === 'published'` の post のみ表示
  - クリックで `/posts/[slug]` へ遷移
- **ローカル** (`!import.meta.env.PROD`):
  - draft / scrap の post も表示
  - draft / scrap の post は `.series-post-item--draft` クラス付き (opacity 0.5、cursor default)
  - draft / scrap の post には "準備中" バッジを表示、クリック不可

---

## series-nav (post-page への追加)

`src/pages/posts/[slug].astro` の `getStaticPaths` で前後記事を計算し、post-page に追加する。

```ts
// getStaticPaths 内で各 post に prev/next を付与
const seriesPosts = posts
  .filter((p) => p.data.series === post.data.series)
  .sort((a, b) => (a.data.series_order ?? 0) - (b.data.series_order ?? 0))

const idx = seriesPosts.findIndex((p) => p.id === post.id)
const seriesNav = post.data.series
  ? {
      prev: seriesPosts[idx - 1] ?? null,
      next: seriesPosts[idx + 1] ?? null,
    }
  : null
```

**表示位置:** 記事本文 (`<article>`) の直下、Backlinks セクションの上。

```
<article class="prose">...</article>

{seriesNav && (
  <nav class="series-nav">
    {seriesNav.prev && (
      <a class="series-nav__btn series-nav__btn--prev" href={`${base}/posts/${seriesNav.prev.id}`}>
        <span>←</span><span>{seriesNav.prev.data.title}</span>
      </a>
    )}
    {seriesNav.next && (
      <a class="series-nav__btn series-nav__btn--next" href={`${base}/posts/${seriesNav.next.id}`}>
        <span>{seriesNav.next.data.title}</span><span>→</span>
      </a>
    )}
  </nav>
)}

<Backlinks ... />
```

---

## タイトル差し替え (home-page・post-page)

series コレクション導入後に暫定スラグ表示を正式タイトルに差し替える。

**home-page (`src/pages/index.astro`):**

```ts
// series コレクションを取得してタイトルを引く
const allSeries = await getCollection('series')
const seriesTitleMap = new Map(allSeries.map((s) => [s.id, s.data.title]))

// series-card の title
seriesTitleMap.get(slug) ?? slug
```

**post-page (`src/pages/posts/[slug].astro`):**

```ts
const seriesEntry = post.data.series
  ? allSeries.find((s) => s.id === post.data.series)
  : null
const seriesTitle = seriesEntry?.data.title ?? post.data.series
```

---

## getStaticPaths

```ts
// src/pages/series/[slug].astro
export async function getStaticPaths() {
  const allSeries = await getCollection('series')
  const allPosts  = await getCollection('posts')

  const seriesList = import.meta.env.PROD
    ? allSeries.filter((s) => s.data.status === 'published')
    : allSeries

  const posts = import.meta.env.PROD
    ? allPosts.filter((p) => p.data.status === 'published')
    : allPosts

  return seriesList.map((s) => {
    const seriesPosts = posts
      .filter((p) => p.data.series === s.id)
      .sort((a, b) => (a.data.series_order ?? 0) - (b.data.series_order ?? 0))

    return {
      params: { slug: s.id },
      props: { series: s, posts: seriesPosts },
    }
  })
}
```

---

## CSS

`src/styles/global.css` に追加:

```css
/* ── SERIES PAGE ────────────────────────────────── */
.series-page__label {
  font-family: var(--font-ui);
  font-size: 0.7rem;
  color: var(--lav);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
}
.series-page__title { font-size: 1.5rem; margin-bottom: 1.8rem; }

.series-post-list { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; }
.series-post-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.85rem 1.1rem;
  border: 1px solid var(--border-l);
  border-radius: var(--r-md);
  background: white;
  cursor: pointer;
  transition: border-color 0.15s;
  text-decoration: none;
  color: inherit;
}
.series-post-item:hover { border-color: var(--lav-b); }
.series-post-item--draft { opacity: 0.5; cursor: default; }
.series-post-item--draft:hover { border-color: var(--border-l); }

.series-post-num {
  font-family: var(--font-ui);
  font-size: 0.78rem;
  color: var(--text-faint);
  min-width: 2ch;
  flex-shrink: 0;
  margin-top: 0.1rem;
}
.series-post-title { font-family: var(--font-ui); font-size: 0.95rem; }

.upcoming-badge {
  display: inline-block;
  margin-left: 0.5rem;
  font-family: var(--font-ui);
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  color: var(--text-faint);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 0 5px;
  vertical-align: middle;
}

/* ── SERIES NAV ─────────────────────────────────── */
.series-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-l);
  gap: 1rem;
}
.series-nav__btn {
  font-family: var(--font-ui);
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--text-muted);
  padding: 0.6rem 1rem;
  border: 1px solid var(--border-l);
  border-radius: var(--r-sm);
  background: white;
  transition: border-color 0.15s, color 0.15s;
  max-width: 48%;
}
.series-nav__btn:hover { border-color: var(--accent-pale); color: var(--accent); }
.series-nav__btn--next { margin-left: auto; text-align: right; }
```

---

## 実装対象ファイル

| ファイル | 役割 |
|---|---|
| `content/series/*.md` | Series メタデータ (新規) |
| `src/content.config.ts` | series コレクション定義追加 |
| `src/pages/series/[slug].astro` | series-page 本体 (新規) |
| `src/pages/posts/[slug].astro` | series-nav 追加 + seriesTitle 差し替え |
| `src/pages/index.astro` | seriesTitle 差し替え |
| `src/styles/global.css` | `.series-page__*` / `.series-post-*` / `.series-nav*` / `.upcoming-badge` 追加 |

---

## テスト戦略

**Playwright (e2e)**:

| ケース | 確認内容 |
|---|---|
| `/series/<slug>` アクセス | タイトル・説明・記事リストが表示される |
| 記事リスト順 | series_order 昇順、ゼロパディング番号 |
| published 記事 | クリックで `/posts/[slug]` へ遷移 |
| draft 記事 (ローカル) | "準備中" バッジ表示、クリック不可 |
| draft 記事 (本番) | 表示されない |
| Breadcrumb | `Home › Series › タイトル` |
| series-nav (prev) | 前記事へのリンクが表示される |
| series-nav (next) | 次記事へのリンクが表示される |
| series 先頭記事 | prev リンクなし |
| series 末尾記事 | next リンクなし |
| series なし post | series-nav が表示されない |
| home-page series-card | series タイトルがスラグでなく title フィールドで表示 |
| post-page series-banner | series タイトルがスラグでなく title フィールドで表示 |

---

## エッジケース

| ケース | 挙動 |
|---|---|
| series に対応する post が 0件 | 空リスト表示 |
| description なし | 説明段落を非表示 |
| series コレクションに存在しない slug を post が参照 (または status が draft/scrap) | home-page: series-card を非表示。post-page: series-banner・series-nav を非表示。series-page は生成されない |
| series_order の重複 | 仕様未定義 — 安定ソートに依存 |

---

## 未決事項

- series_order が重複した場合の挙動 (ビルド警告を出すか否か)
- ~~`/series` 一覧ページの要否~~ → 実装する。詳細は `docs/features/series-index.md`
