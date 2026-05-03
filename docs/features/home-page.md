# home-page

## 概要

`/` ホームページ。hero セクション + 2カラムグリッド（最新記事 | サイドバー）で構成。
Breadcrumb なし。`container` (max-width: 900px) を使用（他ページの `container--narrow` より広い）。

---

## ページ構成

```
[sticky header]

container (max-width: 900px, padding: 2.5rem 1.25rem)
  .home-hero
    h1.home-title        "blog (仮)"
    p.home-subtitle      "理論 CS 学び直しノート"

  .home-grid  (grid-template-columns: 1fr 280px; gap: 3rem)
              (モバイル ≤ 720px: 1カラム、gap: 2rem)

    ── メインカラム ──
      .section-title "最新記事"
      <a class="post-card" href="/posts/[slug]"> × 最大5件 (date 降順)
        .post-card__meta
          span.post-card__date   ← date あり時のみ
          div.post-card__tags    ← TagBadge × 全タグ
        h3.post-card__title
        div.post-card__series    ← series あり時のみ "シリーズ: {seriesSlug} #{order}"
      <a class="view-all" href="${base}/posts">すべての記事を見る →</a>
        ← 記事が 6件以上の場合のみ表示

    ── aside (280px) ──
      .section-title "シリーズ"  ← series がある場合のみセクションごと表示
      <a class="series-card" href="${base}/series/[slug]"> × 全シリーズ
        span.series-card__title
        span.series-card__count  "{n} 記事"

      .section-title "タグ"  ← タグがある場合のみセクションごと表示
        (margin-top: 2rem)
      div (flex, flex-wrap: wrap, gap: 0.4rem)
        <TagBadge> × 全タグ (href あり → /tags/[tag])

[footer]
```

---

## データ取得

```ts
// src/pages/index.astro
import { FILTER_DRAFTS } from '@/config/env'

const allPosts = await getCollection('posts')
const allDefs  = await getCollection('defs')

const posts = (FILTER_DRAFTS
  ? allPosts.filter((p) => p.data.status === 'published')
  : allPosts
).sort((a, b) => {
  if (!a.data.date && !b.data.date) return 0
  if (!a.data.date) return 1
  if (!b.data.date) return -1
  return b.data.date.localeCompare(a.data.date)
})

const defs = FILTER_DRAFTS
  ? allDefs.filter((d) => d.data.status === 'published')
  : allDefs

const recentPosts = posts.slice(0, 5)

// シリーズ: posts から series スラグを集め、件数をカウント
const seriesMap = new Map<string, number>()
for (const post of posts) {
  if (post.data.series) {
    seriesMap.set(post.data.series, (seriesMap.get(post.data.series) ?? 0) + 1)
  }
}

// タグ: posts + defs から全タグ収集 (重複除去)
const allTags = [...new Set([
  ...posts.flatMap((p) => p.data.tags),
  ...defs.flatMap((d) => d.data.tags),
])]
```

---

## "すべての記事を見る" リンク

- 記事が **6件以上** の場合のみ表示。5件以下なら非表示。
- `href="${base}/posts"`
- `/posts` 一覧ページは Phase 2 で追加予定 (plan.md に追記済み)。
- home-page 実装時点では 404 になるが、仕様通りのリンクを設置する。

---

## シリーズのタイトル・記事数

- Phase 2 では `posts` コレクションから series スラグと件数を集計する。
- series タイトルはスラグをそのまま表示（暫定）。series-page 実装後に差し替え。
- series-page で `getCollection('series')` が追加されたら、そちらからタイトルを取得する。

---

## Pagefind

一覧ページのため全体を検索対象外とする:

```html
<div data-pagefind-ignore>
  <!-- ページ全体 -->
</div>
```

---

## CSS

### global.css に追加 (home-page 新規 + post-card 既存への追加)

```css
/* ── HOME HERO ─────────────────────────────────── */
.home-hero {
  margin-bottom: 2.8rem;
  padding: 2.4rem 0 2rem;
}
.home-title {
  font-family: var(--font-ui);
  font-size: 2rem;
  letter-spacing: 0.02em;
  color: var(--text);
  margin-bottom: 0.4rem;
}
.home-subtitle {
  font-family: var(--font-body);
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* ── HOME GRID ──────────────────────────────────── */
.home-grid {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 3rem;
  align-items: start;
}
@media (max-width: 720px) {
  .home-grid { grid-template-columns: 1fr; gap: 2rem; }
}

/* ── SERIES CARD ────────────────────────────────── */
.series-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--border-l);
  border-radius: var(--r-md);
  padding: 0.8rem 1rem;
  margin-bottom: 0.6rem;
  background: white;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s;
}
.series-card:hover { border-color: var(--lav-b); }
.series-card__title { font-family: var(--font-ui); font-size: 0.85rem; }
.series-card__count { font-family: var(--font-ui); font-size: 0.68rem; color: var(--text-faint); }

/* ── POST CARD 追加フィールド (global.css 既存の .post-card に追記) ── */
.post-card__tags  { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.post-card__series {
  font-size: 0.72rem;
  color: var(--text-faint);
  font-family: var(--font-ui);
  margin-top: 0.3rem;
}

/* ── VIEW ALL LINK ──────────────────────────────── */
.view-all {
  display: inline-block;
  margin-top: 0.5rem;
  font-family: var(--font-ui);
  font-size: 0.78rem;
  color: var(--accent);
  text-decoration: none;
  letter-spacing: 0.03em;
}
.view-all:hover { color: var(--accent-dim); text-decoration: underline; }
```

### index.astro の `<style>` ブロック (home-page 固有)

home-page 固有スタイルはなし (すべて global.css に追加)。

---

## 実装対象ファイル

| ファイル | 役割 |
|---|---|
| `src/pages/index.astro` | home-page 本体 |
| `src/styles/global.css` | `.home-hero` / `.home-grid` / `.series-card` / `.post-card__tags` / `.post-card__series` / `.view-all` を追加 |

---

## テスト戦略

**Playwright (e2e)**:

| ケース | 確認内容 |
|---|---|
| `/` アクセス | hero・最新記事・サイドバーが表示される |
| hero | `~/blog $ ls` プロンプト・タイトル・サブタイトルが表示 |
| 最新記事 | `.post-card` が最大5件表示、date 降順 |
| post-card リンク | `/posts/[slug]` へのリンク |
| post-card tags | `TagBadge` が表示 |
| series 付き記事 | `.post-card__series` が表示 |
| series なし記事 | `.post-card__series` が非表示 |
| 5件以下 | "すべての記事を見る" リンクが非表示 |
| 6件以上 | "すべての記事を見る" リンクが `/posts` へ表示 |
| シリーズ一覧 | `.series-card` が表示、`/series/[slug]` へのリンク |
| シリーズなし | シリーズセクションが非表示 |
| タグ一覧 | `TagBadge` が全タグ表示、`/tags/[tag]` へのリンク |
| タグなし | タグセクションが非表示 |
| `status: draft` (本番) | フィルタされて記事・定義に含まれない |

---

## エッジケース

| ケース | 挙動 |
|---|---|
| 記事0件 | `.section-title "最新記事"` は残し、post-card なし |
| series なし | シリーズセクションごと非表示 |
| tags 0件 | タグセクションごと非表示 |
| post の `date` なし | `.post-card__date` 非表示（date なしは date あり記事の後ろに並ぶ） |
| 記事5件以下 | "すべての記事を見る" リンク非表示 |
| series タイトル | 暫定でスラグ表示（series-page 実装後に差し替え） |

---

## 未決事項

- `/posts` 一覧ページの spec は Phase 2 で追加予定 (plan.md 参照)。
