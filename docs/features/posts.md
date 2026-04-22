# posts

## 概要

`/posts` 記事一覧ページ。全記事を日付降順で10件ずつページネーション表示する。

- **URL**: `/posts` (1ページ目), `/posts/page/[n]` (2ページ目以降)
- **実装ブランチ**: feat/phase-2-posts-page

home-page の「最新記事5件」に対し、全記事を閲覧するための入口となる。

---

## ページ構成

```
[sticky header: $ kise.dev  |  home posts* defs series]
                                    ↑ active

container--narrow (max-width: 720px, padding: 2.5rem 1.25rem)
  [Breadcrumb: Home › Posts]
    ※ "Posts" は plain text (現在のページ)

  <div class="section-title">記事</div>   ← section-title スタイル

  [post-card × 10]
    (post-card の構造は下記参照)

  [pagination]
    ← 前のページ    1 / 3    次のページ →

[footer]
```

---

## PostCard

プロトタイプの `.post-card` をそのまま踏襲。home-page・tag-page でも同一デザインを使うため
`src/components/PostCard.astro` として共通コンポーネント化する。

```astro
---
// PostCard.astro
interface Props {
  title: string
  href: string
  date?: string
  tags: string[]
  series?: string        // series タイトル (スラグではなく表示文字列)
  seriesOrder?: number
}
---

<a class="post-card" href={href}>
  <div class="post-card__meta">
    {date && <span class="post-card__date">{date}</span>}
    <div class="post-card__tags">
      {tags.map((tag) => <TagBadge tag={tag} href={`${base}/tags/${tag}`} />)}
    </div>
  </div>
  <h3 class="post-card__title">{title}</h3>
  {series && (
    <div class="post-card__series">
      シリーズ: {series} #{seriesOrder}
    </div>
  )}
</a>
```

### PostCard CSS (既存 global.css を参照)

既に `global.css` に `.post-card` スタイルが定義されている場合はそのまま使用。
未定義の場合は下記を追加:

```css
/* ── POST CARD ─────────────────────────────────── */
.post-card {
  display: block;
  border: 1px solid var(--border-l);
  border-radius: var(--r-md);
  padding: 1.1rem 1.3rem;
  margin-bottom: 0.85rem;
  text-decoration: none;
  color: inherit;
  background: white;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
}
.post-card:hover {
  border-color: var(--accent-pale);
  box-shadow: 0 2px 12px rgba(61, 158, 138, 0.08);
  transform: translateY(-1px);
}
.post-card__meta {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.35rem;
  flex-wrap: wrap;
}
.post-card__date {
  font-family: var(--font-ui);
  font-size: 0.68rem;
  color: var(--text-faint);
}
.post-card__tags { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.post-card__title {
  font-family: var(--font-ui);
  font-size: 0.98rem;
  color: var(--text);
  font-weight: normal;
  line-height: 1.45;
}
.post-card:hover .post-card__title { color: var(--link); }
.post-card__series {
  font-size: 0.72rem;
  color: var(--text-faint);
  font-family: var(--font-ui);
  margin-top: 0.3rem;
}
```

---

## ソート順

日付降順。`date` フィールドがない記事は末尾に寄せる。

```ts
const sorted = allPosts.sort((a, b) => {
  if (!a.data.date && !b.data.date) return 0
  if (!a.data.date) return 1
  if (!b.data.date) return -1
  return b.data.date.localeCompare(a.data.date)
})
```

これは `src/pages/index.astro` の既存ロジックと同一。

---

## ページネーション

- 1ページあたり **10件**
- URL 構造:
  - 1ページ目: `/posts` (`src/pages/posts/index.astro`)
  - 2ページ目以降: `/posts/page/[n]` (`src/pages/posts/page/[page].astro`)
- 既存の `src/pages/posts/[slug].astro` と競合しない構造

### index.astro (1ページ目)

`getStaticPaths` 不要。直接データを取得してスライス。

```ts
const PAGE_SIZE = 10
const allPosts = await getCollection('posts')
const posts = filterAndSort(allPosts)   // status フィルタ + 日付ソート
const totalPages = Math.ceil(posts.length / PAGE_SIZE)
const pagePosts = posts.slice(0, PAGE_SIZE)
```

### page/[page].astro (2ページ目以降)

```ts
export async function getStaticPaths() {
  const PAGE_SIZE = 10
  const allPosts = await getCollection('posts')
  const posts = filterAndSort(allPosts)
  const totalPages = Math.ceil(posts.length / PAGE_SIZE)

  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => {
    const page = i + 2
    return {
      params: { page: String(page) },
      props: {
        posts: posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        currentPage: page,
        totalPages,
      },
    }
  })
}
```

### ページナビゲーション UI

```
(prev disabled on page 1)
← 前のページ    1 / 3    次のページ →
```

```astro
<nav class="posts-pagination">
  {currentPage > 1
    ? <a class="posts-pagination__btn" href={prevHref}>← 前のページ</a>
    : <span class="posts-pagination__btn posts-pagination__btn--disabled">← 前のページ</span>
  }
  <span class="posts-pagination__info">{currentPage} / {totalPages}</span>
  {currentPage < totalPages
    ? <a class="posts-pagination__btn" href={nextHref}>次のページ →</a>
    : <span class="posts-pagination__btn posts-pagination__btn--disabled">次のページ →</span>
  }
</nav>
```

URL 生成:

```ts
const prevHref = currentPage === 2
  ? `${base}/posts`
  : `${base}/posts/page/${currentPage - 1}`
const nextHref = `${base}/posts/page/${currentPage + 1}`
```

### ページナビゲーション CSS

```css
/* ── POSTS PAGINATION ──────────────────────────── */
.posts-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-l);
  font-family: var(--font-ui);
  font-size: 0.78rem;
}
.posts-pagination__btn {
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--border-l);
  border-radius: var(--r-sm);
  background: white;
  transition: border-color 0.15s, color 0.15s;
}
.posts-pagination__btn:hover { border-color: var(--accent-pale); color: var(--accent); }
.posts-pagination__btn--disabled {
  color: var(--text-faint);
  border-color: var(--border-l);
  cursor: default;
  opacity: 0.5;
}
.posts-pagination__info { color: var(--text-faint); }
```

---

## status フィルタ

```ts
const posts = import.meta.env.PROD
  ? allPosts.filter((p) => p.data.status === 'published')
  : allPosts
```

ローカルでは draft/scrap も表示される。

---

## series タイトル

home-page と同様に `series` コレクションからタイトルを引く。

```ts
const allSeries = await getCollection('series')
const seriesTitleMap = new Map(
  (import.meta.env.PROD
    ? allSeries.filter((s) => s.data.status === 'published')
    : allSeries
  ).map((s) => [s.id, s.data.title])
)
```

PostCard の `series` prop には `seriesTitleMap.get(post.data.series)` を渡す。
series コレクションに存在しないスラグ (`seriesTitleMap` にキーがない) の場合は `series` prop を渡さず非表示。

---

## Pagefind

一覧ページはコンテンツではないため全体に `data-pagefind-ignore` を付与。

```astro
<div class="container--narrow" data-pagefind-ignore>
  ...
</div>
```

---

## Breadcrumb と nav の更新

### /posts 実装後の post-page 更新

`docs/features/post-page.md` に「実装後にリンク化する」と記載されている Breadcrumb の "Posts" を
`href: \`${base}/posts\`` でリンク化する。

### Layout.astro

nav の `posts` リンクは既に `${base}/posts` を向いている。変更不要。
`activePage="post"` を渡すと "posts" がハイライトされる (既存の `key: 'post'` と対応)。

---

## 実装対象ファイル

| ファイル | 役割 |
|---|---|
| `src/pages/posts/index.astro` | 記事一覧 1ページ目 (新規) |
| `src/pages/posts/page/[page].astro` | 記事一覧 2ページ目以降 (新規) |
| `src/components/PostCard.astro` | post-card コンポーネント (新規・home-page からも使用) |
| `src/pages/index.astro` | PostCard コンポーネント利用に差し替え |
| `src/pages/posts/[slug].astro` | Breadcrumb "Posts" をリンク化 |
| `src/styles/global.css` | `.post-card` / `.posts-pagination` を追加 (未定義の場合) |

---

## テスト戦略

**Playwright (e2e)**:

| ケース | 確認内容 |
|---|---|
| `/posts` アクセス | post-card 一覧が表示される |
| 件数 | 最大 10 件表示 |
| ソート順 | date 降順になっている |
| Breadcrumb | `Home › Posts` |
| nav | "posts" がアクティブ表示 |
| `date` なし記事 | date 表示なし、末尾に表示 |
| `series` なし記事 | `.post-card__series` が表示されない |
| pagination: 1ページ目 | "← 前のページ" が disabled、"次のページ →" がリンク |
| pagination: 最終ページ | "次のページ →" が disabled、"← 前のページ" がリンク |
| pagination: 中間ページ | 両方リンク |
| `/posts/page/1` | 存在しない (1ページ目は `/posts`) |
| `status: draft` (本番) | 一覧に表示されない |
| 記事 10件以下 | pagination が表示されない (totalPages === 1) |
| PostCard クリック | `/posts/[slug]` へ遷移 |

---

## エッジケース

| ケース | 挙動 |
|---|---|
| 記事 0件 | post-card なし、pagination なし |
| 記事 10件以下 | pagination なし (totalPages === 1 → `/posts/page/2` は生成されない) |
| `date` なし記事 | ソート末尾。`post-card__date` 非表示 |
| `series` スラグが series コレクションに存在しない | `post-card__series` 非表示 |
| `status: draft` (ローカル) | 一覧に表示される |
| `/posts/page/0` や `/posts/page/999` | Astro の `getStaticPaths` で生成されないため 404 |

---

## 未決事項

- ページネーションの具体的な UI (ページ番号リスト表示 vs prev/next のみ) — UI フェーズで再確認
- 記事一覧のページヘッダ文言・スタイル — UI フェーズで再確認
- PostCard の抜粋 (excerpt) 表示 — 現状は非対応、要検討
