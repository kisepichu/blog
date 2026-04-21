# post-page

## 概要

`/posts/[slug]` 記事ページ。記事本文・タグ・series バナー・backlink を表示する。

**このブランチ (feat/phase-2-post-page) で実装する。**  
共有コンポーネント (Layout, Breadcrumb, TagBadge, Backlinks) と CSS トークンは def-page ブランチで整備済み。

---

## ページ構成

```
[sticky header: $ kise.dev  |  home posts defs series]

container--narrow (max-width: 720px, padding: 2.5rem 1.25rem)
  [Breadcrumb: Home › Posts › 型理論入門]
    ※ "Posts" は plain text (リンクなし)。/posts 一覧ページが実装されたらリンク化する

  [series-banner]  ← series あり時のみ、post-header の上に表示
    "シリーズ:"  +  [/series/slug へのリンク: 型理論入門]  +  "#1"
    style: lav-bg bg, lav-b border, r-sm, font-ui 0.72rem, lav color, padding 0.4rem 0.9rem

  [post-header]
    h1: 型理論入門   ← 1.55rem  ※ "記事 / POST" ラベルはなし (def-page と異なる)
    [post-meta]
      [2025-04-10]   ← font-ui, 0.72rem, text-faint
      [#型理論 tag]  ← TagBadge (href=`${base}/tags/${encodeURIComponent(tag)}`)

  <article class="prose">
    <Content />     ← 本文全体 (ローカル定義・[[term]] リンク・::embed[term] を含む)

  {/* TODO: series-nav (Phase 3) */}

  [backlinks]       ← バックリンクがある場合のみ (現 Phase では常に空、後述)

[footer]
```

---

## Layout・Breadcrumb

```astro
<Layout title={post.data.title} activePage="post">
  ...
</Layout>
```

```astro
<Breadcrumb items={[
  { label: 'Home', href: `${base}/` },
  { label: 'Posts' },                    // リンクなし
  { label: post.data.title },
]} />
```

`/posts` 一覧ページは後続フェーズで実装。実装されたら `href: \`${base}/posts\`` を追加する。

---

## series バナー

post-header の **上** に独立したバナーとして表示する。

```astro
{post.data.series && (
  <div class="series-banner">
    <span>シリーズ:</span>
    <a href={`${base}/series/${post.data.series}`}>{seriesTitle}</a>
    <span class="series-banner__order">#{post.data.series_order}</span>
  </div>
)}
```

`seriesTitle` の取得方法: `getCollection('posts')` で同じ `series` スラグを持つ記事の先頭から取得する方法は重複スキャンになるため、Phase 2 では **スラグをそのまま表示** する。series ページ実装後に再検討。

```astro
const seriesTitle = post.data.series  // 暫定: スラグ表示
```

### CSS (.series-banner)

```css
.series-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  background: var(--lav-bg);
  border: 1px solid var(--lav-b);
  border-radius: var(--r-sm);
  padding: 0.4rem 0.9rem;
  margin-bottom: 1.2rem;
  color: var(--lav);
}
.series-banner__order {
  color: var(--lav);
  opacity: 0.6;
}
```

---

## `date` フィールド

プロトタイプでは `post-date` が表示されている。現在の `content.config.ts` に `date` フィールドが未定義のため、スキーマに追加する。

```ts
// content.config.ts への追加
// Astro の YAML パーサーが YYYY-MM-DD を Date オブジェクトに変換するため union で両対応
date: z.union([z.string(), z.date().transform((d) => d.toISOString().slice(0, 10))]).optional(),
```

表示:
```astro
{post.data.date && (
  <span class="post-date">{post.data.date}</span>
)}
```

---

## Pagefind 対応

def-page と異なり、記事全体が検索対象:

```html
<span data-pagefind-meta="type:post" hidden></span>
{tags.length > 0 && <span data-pagefind-meta={`tags:${tags.join(',')}`} hidden></span>}
{series && <span data-pagefind-meta={`series:${series}`} hidden></span>}

<article class="prose" data-pagefind-body>
  <Content />
</article>

<div data-pagefind-ignore>
  <Backlinks items={backlinks} />
</div>
```

---

## getStaticPaths

def-page と同じパターン。backlink グラフのキーは def の canonical id のため、
`backlinkGraph[post.id]` は常に `[]` になる (現仕様では `[[term]]` は定義参照専用)。  
Backlinks コンポーネントは空配列時に非表示になるため UI 上の問題はなし。  
将来的に post 間参照追跡が追加された時のために props 構造は維持する。

```ts
// src/pages/posts/[slug].astro
export async function getStaticPaths() {
  const allPosts = await getCollection('posts')
  const allDefs  = await getCollection('defs')

  const posts = import.meta.env.PROD
    ? allPosts.filter((p) => p.data.status === 'published')
    : allPosts
  const defs = import.meta.env.PROD
    ? allDefs.filter((d) => d.data.status === 'published')
    : allDefs

  const aliasMap = buildAliasMap(
    defs.map((d) => ({ id: d.id, aliases: d.data.aliases, status: d.data.status })),
  )

  const entries = [
    ...defs.map((d) => ({
      type: 'definition' as const,
      slug: d.id,
      title: d.data.title,
      body: d.body ?? '',
    })),
    ...posts.map((p) => ({
      type: 'post' as const,
      slug: p.id,
      title: p.data.title,
      body: p.body ?? '',
    })),
  ]

  const backlinkGraph = await getBacklinkGraph(entries, aliasMap)

  return posts.map((post) => ({
    params: { slug: post.id },
    props: {
      post,
      backlinks: backlinkGraph[post.id] ?? [],
    },
  }))
}
```

---

## CSS

既存の共有スタイル (`global.css`, `tokens.css`) をそのまま使用。  
post-page 固有のスタイルのみ `[slug].astro` の `<style>` ブロックに記述する。

| セレクタ | 主なスタイル |
|---|---|
| `.post-header` | `margin-bottom: 2.2rem` |
| `.post-title` | font-size 1.55rem, letter-spacing 0.01em, line-height 1.35, margin-bottom 0.7rem |
| `.post-meta` | flex, align-items center, gap 0.8rem, flex-wrap wrap |
| `.post-date` | font-ui, 0.72rem, text-faint |
| `.post-tags` | flex, gap 0.35rem, flex-wrap wrap |
| `.series-banner` | 上述 |
| `.series-banner__order` | lav color, opacity 0.6 |

---

## 実装対象ファイル

| ファイル | 役割 |
|---|---|
| `src/pages/posts/[slug].astro` | post-page 本体 |
| `src/content.config.ts` | `date` フィールドをスキーマに追加 |

共有コンポーネント・CSS は def-page ブランチで作成済み。

---

## テスト戦略

**Playwright (e2e)**:

| ケース | 確認内容 |
|---|---|
| `/posts/<slug>` アクセス | h1 タイトルが表示される |
| post-meta | 日付・タグが表示される |
| series バナー | series あり記事でバナーが post-header の上に表示される |
| series バナーなし | series なし記事でバナーが表示されない |
| MathJax | 数式がレンダリングされている |
| Breadcrumb | Home › Posts › タイトル の順で表示、"Posts" はリンクなし |
| `[[term]]` リンク | concept-link としてレンダリングされている |
| `::embed[term]` | definition-block が展開されている |
| `status: draft` (本番) | `getStaticPaths` でフィルタされ 404 |
| 存在しない slug | 404 または Astro デフォルトエラーページ |

---

## エッジケース

| ケース | 挙動 |
|---|---|
| `tags` が空 | タグ行を非表示 |
| `date` なし | 日付表示なし |
| `series` なし | series バナーを非表示 |
| バックリンクなし | Backlinks セクションを非表示 (現 Phase では常にこの状態) |
| `status: draft` (本番) | `getStaticPaths` でフィルタされ 404 |

---

## 未決事項

- series バナーの表示文字列: スラグをそのまま使うか、series ページのタイトルを取得するか (Phase 3 の series-page 実装後に再検討)
- `/posts` 一覧ページ実装後に Breadcrumb "Posts" をリンク化
