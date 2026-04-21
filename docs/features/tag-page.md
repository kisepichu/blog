# tag-page

## 概要

`/tags/[tag]` タグ別一覧ページ。タグに属する記事・定義を一覧表示する。

**このブランチ (feat/phase-2-tag-page) で実装する。**  
共有コンポーネント (Layout, Breadcrumb, TagBadge) は def-page ブランチで整備済み。  
本ブランチで `global.css` に共有スタイル (`.section-title`, `.post-card`, `.def-compact`) を追加する。

---

## ページ構成

```
[sticky header]

container--narrow (max-width: 720px, padding: 2.5rem 1.25rem)
  [Breadcrumb: Home › Tags › 集合論]
    "Tags" plain text (リンクなし)
    "集合論" plain text (現在ページ)

  <header>
    h1.tag-title
      [TagBadge: #集合論]  ← href なし (自ページなので装飾のみ)
      <span class="tag-name">集合論</span>

  {記事セクション} ← posts あり時のみ
    .section-title "── 記事"
    <a class="post-card" href="/posts/[slug]"> × N
      .post-card__meta
        span.post-card__date  ← date あり時のみ
      h3.post-card__title

  {定義セクション} ← defs あり時のみ
    .section-title "── 定義"
    .def-compact
      <a class="def-compact-item" href="/defs/[id]">
        span.def-compact-item__title
        span.def-compact-item__id

[footer]
```

---

## タグ URL 規則

- `params.tag` = **raw タグ名** (encodeURIComponent しない)
- Astro が `/tags/集合論/index.html` を生成する
- 他ページ (def-page・post-page) の TagBadge href も raw に統一する
  - **変更対象**: `src/pages/defs/[id].astro`・`src/pages/posts/[slug].astro` の `encodeURIComponent(tag)` を `tag` に変更

---

## Breadcrumb

```astro
<Breadcrumb items={[
  { label: 'Home', href: `${base}/` },
  { label: 'Tags' },          // リンクなし
  { label: tag },              // リンクなし (現在ページ)
]} />
```

---

## getStaticPaths

```ts
// src/pages/tags/[tag].astro
export async function getStaticPaths() {
  const allPosts = await getCollection('posts')
  const allDefs  = await getCollection('defs')

  const posts = import.meta.env.PROD
    ? allPosts.filter((p) => p.data.status === 'published')
    : allPosts
  const defs = import.meta.env.PROD
    ? allDefs.filter((d) => d.data.status === 'published')
    : allDefs

  // タグ → { posts, defs } マップを構築
  const tagMap = new Map<string, { posts: typeof posts; defs: typeof defs }>()
  const ensure = (tag: string) => {
    if (!tagMap.has(tag)) tagMap.set(tag, { posts: [], defs: [] })
    return tagMap.get(tag)!
  }
  for (const post of posts) post.data.tags.forEach((t) => ensure(t).posts.push(post))
  for (const def  of defs)  def.data.tags.forEach((t)  => ensure(t).defs.push(def))

  return [...tagMap.entries()].map(([tag, { posts, defs }]) => ({
    params: { tag },            // raw タグ名
    props:  { tag, tagPosts: posts, tagDefs: defs },
  }))
}
```

---

## Pagefind

タグページはナビゲーション/一覧ページのため全体を検索対象外とする:

```html
<div data-pagefind-ignore>
  <!-- ページ全体 -->
</div>
```

---

## CSS

### global.css に追加 (home-page でも使用)

```css
/* ── SECTION TITLE ──────────────────────────────── */
.section-title {
  font-family: var(--font-ui);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--text-faint);
  text-transform: uppercase;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.section-title::before { content: '──'; letter-spacing: -0.1em; color: var(--border); }

/* ── POST CARD ──────────────────────────────────── */
.post-card {
  display: block;
  border: 1px solid var(--border-l);
  border-radius: var(--r-md);
  padding: 1.1rem 1.3rem;
  margin-bottom: 0.85rem;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  background: white;
  text-decoration: none;
  color: inherit;
}
.post-card:hover {
  border-color: var(--accent-pale);
  box-shadow: 0 2px 12px rgba(61,158,138,0.08);
  transform: translateY(-1px);
}
.post-card__meta {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.35rem;
  flex-wrap: wrap;
}
.post-card__date { font-family: var(--font-ui); font-size: 0.68rem; color: var(--text-faint); }
.post-card__title {
  font-family: var(--font-ui);
  font-size: 0.98rem;
  color: var(--text);
  font-weight: normal;
  line-height: 1.45;
}
.post-card:hover .post-card__title { color: var(--link); }

/* ── DEF COMPACT ────────────────────────────────── */
.def-compact { display: flex; flex-direction: column; gap: 0.35rem; }
.def-compact-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.45rem 0.8rem;
  border-radius: var(--r-sm);
  background: var(--accent-bg);
  transition: background 0.1s;
  text-decoration: none;
  color: inherit;
}
.def-compact-item:hover { background: var(--accent-pale); }
.def-compact-item__title { font-size: 0.88rem; }
.def-compact-item__id { font-family: var(--font-code); font-size: 0.68rem; color: var(--text-faint); }
```

### [tag].astro の `<style>` ブロック (tag-page 固有)

```css
.tag-title {
  font-size: 1.4rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.tag-name { font-family: var(--font-ui); }
.tag-section { margin-bottom: 2.5rem; }
```

---

## 実装対象ファイル

| ファイル | 役割 |
|---|---|
| `src/pages/tags/[tag].astro` | tag-page 本体 |
| `src/styles/global.css` | `.section-title` / `.post-card` / `.def-compact` を追加 |
| `src/pages/defs/[id].astro` | TagBadge href の `encodeURIComponent` を除去 |
| `src/pages/posts/[slug].astro` | TagBadge href の `encodeURIComponent` を除去 |

---

## テスト戦略

**Playwright (e2e)**:

| ケース | 確認内容 |
|---|---|
| `/tags/集合論` アクセス | ページが表示される |
| Breadcrumb | Home › Tags › 集合論 の順、"Tags"・"集合論" はリンクなし |
| h1 | TagBadge `#集合論` + タグ名が表示される |
| 記事セクション | `.section-title` "記事" + `.post-card` が表示される |
| post-card | タイトルが `/posts/[slug]` へのリンクになっている |
| 定義セクション | `.section-title` "定義" + `.def-compact-item` が表示される |
| def-compact-item | タイトル・id が `/defs/[id]` へのリンクになっている |
| 記事なし | 記事セクションが非表示 |
| 定義なし | 定義セクションが非表示 |
| 存在しないタグ | 404 |

---

## エッジケース

| ケース | 挙動 |
|---|---|
| 記事なし・定義のみ | 記事セクション非表示、定義セクションのみ表示 |
| 定義なし・記事のみ | 定義セクション非表示、記事セクションのみ表示 |
| post の `date` なし | `.post-card__date` を非表示 |
| `status: draft` (本番) | `getStaticPaths` でフィルタされ、そのタグのカウントに含まれない |
| タグにその他特殊文字 | Astro が静的パスとして生成できる範囲で動作 |

---

## 未決事項

- タグ一覧ページ (`/tags`) の要否 (Breadcrumb の "Tags" がリンクになるか影響)
- post-card に tags を表示するか (プロトタイプの tag-page では tags 非表示、home-page では表示)
