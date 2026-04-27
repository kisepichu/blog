# series-index

## 概要

`/series` シリーズ一覧ページ。全シリーズをひとつのページに連結して表示する。
`/series/[slug]` の内容 (タイトル・説明・記事リスト) をシリーズ数だけ縦に並べたレイアウト。

---

## ページ構成

```
[sticky header]

container--narrow (max-width: 720px, padding: 2.5rem 1.25rem)

  [Breadcrumb: Home › Series]

  <h1 class="series-index__heading">シリーズ</h1>

  {seriesList.map(series => (
    <section class="series-index__section">
      <div class="series-page__label">シリーズ</div>
      <h2 class="series-page__title">
        <a href="/series/{slug}">{series.data.title}</a>
      </h2>
      {series.data.description && (
        <p class="series-index__desc">{series.data.description}</p>
      )}

      <ol class="series-post-list">
        {/* /series/[slug] と同じ記事リスト */}
        {posts.map(post => (
          <li class="series-post-item [series-post-item--draft]">
            <span class="series-post-num">01</span>
            <div>
              <span class="series-post-title">{post.data.title}</span>
              {post.isDraft && <span class="upcoming-badge">準備中</span>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  ))}

[footer]
```

---

## ソート順

シリーズの表示順: **そのシリーズ内の記事の最新 `date` が大きい順 (降順)**。
`date` を持つ記事がない場合は末尾に回す。

```ts
function latestDate(posts: CollectionEntry<'posts'>[]): string | null {
  const dates = posts.map((p) => p.data.date).filter(Boolean) as string[]
  return dates.length > 0 ? dates.sort().at(-1)! : null
}

seriesWithPosts.sort((a, b) => {
  const da = latestDate(a.posts)
  const db = latestDate(b.posts)
  if (!da && !db) return 0
  if (!da) return 1
  if (!db) return -1
  return db.localeCompare(da)
})
```

---

## 記事リストの表示ルール

`/series/[slug]` と同じルールを適用する:

- `series_order` 昇順
- **本番** (`import.meta.env.PROD`): `status === 'published'` の post のみ表示・クリック可能
- **ローカル** (`!import.meta.env.PROD`): draft / scrap も `.series-post-item--draft` + "準備中" バッジ付きで表示・クリック不可

---

## ナビゲーション

`Layout.astro` の navItems に `series` を追加 (ページが実装された段階で):

```ts
{ label: 'series', href: `${base}/series`, key: 'series' }
```

`activePage === 'series'` を受け取るページ: `/series` および `/series/[slug]`。

---

## 実装対象ファイル

| ファイル | 役割 |
|---|---|
| `src/pages/series/index.astro` | series-index ページ本体 (新規) |
| `src/components/Layout.astro` | navItems に `series` 追加 |
| `src/styles/global.css` | `.series-index__*` スタイル追加 |

既存の `.series-page__*` / `.series-post-*` CSS はそのまま流用する。

---

## CSS 追加分

```css
/* ── SERIES INDEX PAGE ───────────────────────────── */
.series-index__heading {
  font-family: var(--font-ui);
  font-size: 1.3rem;
  margin-bottom: 2rem;
}

.series-index__section {
  margin-bottom: 3rem;
  padding-bottom: 3rem;
  border-bottom: 1px solid var(--border-l);
}
.series-index__section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.series-index__desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}
```

---

## テスト戦略

**Playwright (e2e)** — `e2e/series-index.e2e.ts`:

| ケース | 確認内容 |
|---|---|
| `/series` アクセス | h1 またはセクションが表示される |
| series セクション | e2e フィクスチャシリーズのタイトルが表示される |
| 記事リスト | `series_order` 昇順で表示される |
| description あり series | 説明文が表示される |
| series タイトルがリンク | `/series/[slug]` へのリンクになっている |
| ローカル: draft 記事 | "準備中" バッジが表示される |
| nav | ヘッダーに "series" リンクが表示される |
| nav active | `/series` 訪問時に "series" リンクが `.active` になっている |

---

## エッジケース

| ケース | 挙動 |
|---|---|
| シリーズが 0 件 | 空ページ (セクションなし) |
| series に記事が 0 件 | 空の `<ol>` を表示 |
| description なし | 説明段落を非表示 |
| 全記事に `date` なし | そのシリーズは末尾に表示 |

---

## 未決事項

なし
