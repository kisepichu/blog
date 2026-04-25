# search

## 概要

Pagefind を使った全文検索。ヘッダーナビの検索ボックスから入力し、`/search` ページで結果を表示する。`#tag` / `@type` prefix でインライン絞り込みが可能。

---

## 仕様

### インストール・ビルド

- パッケージ: `pagefind` (devDependencies)
- `package.json` の `build` スクリプトを更新:
  ```json
  "build": "astro build && pagefind --site dist"
  ```
- GitHub Actions (`.github/workflows/deploy.yml`): `pnpm build` がそのまま Pagefind インデックス生成まで行うため変更不要
- 生成物: `dist/pagefind/` — Pagefind JS ランタイム + インデックス (`.gitignore` 対象)

### ヘッダー検索ボックス

`Layout.astro` のヘッダーナビ内、ナビリンクの右に検索 `<input>` を追加する。

```html
<form action="{base}/search" method="get" class="header-search">
  <input
    type="search"
    name="q"
    placeholder="search..."
    class="header-search__input"
    aria-label="検索"
    autocomplete="off"
  />
</form>
```

- Enter / submit で `/search?q=<query>` に GET 遷移
- `Layout` の `activePage` 型に `'search'` を追加

### `/search` ページ

- ファイル: `src/pages/search.astro`
- URL: `/search?q=<query>`
- `Astro.url.searchParams.get('q')` で初期クエリを取得し React island に props として渡す
- `pagefindIgnore={true}` を `Layout` に渡すことで `<body data-pagefind-ignore="all">` が付与され、ページ全体を検索インデックス対象外にする (ヘッダー・フッターまで含めて除外するため `<body>` に付与する方式を採用)

```astro
---
const initialQuery = Astro.url.searchParams.get('q') ?? ''
---
<Layout title="検索 | kise.dev" activePage="search" pagefindIgnore={true}>
  <div class="container--narrow">
    <SearchInterface client:load initialQuery={initialQuery} baseUrl={import.meta.env.BASE_URL} />
  </div>
</Layout>
```

### SearchInterface コンポーネント

`src/components/SearchInterface.tsx` — React island。Pagefind JS API を動的インポートして使用する。

```ts
// Pagefind は dist/pagefind/pagefind.js として配置される
const pagefind = await import(/* @vite-ignore */ `${baseUrl}pagefind/pagefind.js`)
await pagefind.init()
```

#### 入力ボックスの prefix filter 機能

| 入力 | 動作 |
|------|------|
| `#` (直後に文字なし) | 全タグ候補をドロップダウン表示 |
| `#<部分文字列>` | 部分一致するタグ候補をドロップダウン表示 |
| `@` | type 候補 (`post`, `definition`) をドロップダウン表示 |
| 上記以外のテキスト | Pagefind 全文検索クエリ |

候補は `pagefind.filters()` で取得する (Pagefind がインデックスから動的に返す)。

候補をクリック / Enter 選択すると:
1. input から prefix 部分 (`#tag` or `@type`) を除去
2. filter chip として追加
3. ドロップダウンを閉じる

filter chip:
- 各 chip に削除ボタン (×)
- 複数 chip は AND 結合
- type chip は最大 1 つ (上書き)

#### 検索実行

```ts
const results = await pagefind.search(query, {
  filters: {
    ...(typeFilter && { type: [typeFilter] }),
    ...(tagFilters.length > 0 && { tags: tagFilters }),
  },
})
const data = await Promise.all(results.results.slice(0, 20).map(r => r.data()))
```

クエリが空文字かつフィルタなし → 検索を実行しない (0 件表示もしない)。

#### 検索結果の表示

各結果を `meta.type` で分岐してカード表示する。

**Post 結果** (`meta.type === 'post'`):

```
┌─────────────────────────────────────────┐
│ [post]  タイトル                         │
│ 2025-04-10  #型理論  #ラムダ計算         │
│ ...スニペット...                          │
└─────────────────────────────────────────┘
```

`PostCard.astro` は Astro コンポーネントのため React からは使えない。
`SearchResultPost` (React) として同等のマークアップを実装する。

**Definition 結果** (`meta.type === 'definition'`):

```
┌─────────────────────────────────────────┐
│ [def]  タイトル                          │
│ #集合論  aliases: poset, 半順序           │
│ ...スニペット...                          │
└─────────────────────────────────────────┘
```

`SearchResultDef` (React) として実装する。

**共通:**
- Pagefind が生成した `excerpt` (スニペット) を `dangerouslySetInnerHTML` で表示
  (`<mark>` タグで検索語がハイライトされる)
- 結果の `url` にリンク

**件数・状態表示:**
- ローディング中: スケルトン (3件分)
- 0件: 「"<query>" に一致する結果が見つかりませんでした」
- N件: 「N 件の結果」(上限 20 件取得・表示)

---

## Pagefind メタデータ属性

### post-page (`src/pages/posts/[slug].astro`) — 変更あり

`data-pagefind-meta` (表示用) に加え、フィルタに使う `data-pagefind-filter` を追加する。

```html
<!-- フィルタ用 (1 タグ 1 span) -->
<span data-pagefind-filter="type:post" hidden></span>
{tags.map(t => <span data-pagefind-filter={`tags:${t}`} hidden></span>)}

<!-- 表示メタデータ用: tags はカンマ結合の 1 span (meta は複数同名属性で最後の値しか残らないため) -->
<span data-pagefind-meta="type:post" hidden></span>
{tags.length > 0 && <span data-pagefind-meta={`tags:${tags.join(',')}`} hidden></span>}
{date && <span data-pagefind-meta={`date:${date}`} hidden></span>}
{series && <span data-pagefind-meta={`series:${series}`} hidden></span>}

<article class="prose" data-pagefind-body>
  <Content />
</article>
<div data-pagefind-ignore><Backlinks /></div>
```

### def-page (`src/pages/defs/[id].astro`) — 変更あり

検索対象を **definition_block のみ** に限定する (`spec.md` 方針)。

```html
<!-- フィルタ用 (1 タグ 1 span) -->
<span data-pagefind-filter="type:definition" hidden></span>
{tags.map(t => <span data-pagefind-filter={`tags:${t}`} hidden></span>)}

<!-- 表示メタデータ用: tags はカンマ結合の 1 span -->
<span data-pagefind-meta="type:definition" hidden></span>
{tags.length > 0 && <span data-pagefind-meta={`tags:${tags.join(',')}`} hidden></span>}
{aliases.length > 0 && <span data-pagefind-meta={`aliases:${aliases.join(',')}`} hidden></span>}

<!-- def-content から data-pagefind-body を削除 -->
<div class="def-content prose">
  <Content />
</div>
<div data-pagefind-ignore><Backlinks /></div>
```

`data-pagefind-body` は `remark-definition-block.ts` が生成する `.definition-block` div に付与する:

```ts
// remark-definition-block.ts 内
const blockNode = {
  type: 'element',
  tagName: 'div',
  properties: {
    className: ['definition-block'],
    'data-pagefind-body': true,   // ← 追加
  },
  children: [...],
}
```

Pagefind の仕様上、ページ内に `data-pagefind-body` を持つ要素が存在する場合、その要素の中身のみがインデックスされる。補足本文は `data-pagefind-body` の外にあるため自動的に除外される。

---

## 実装対象ファイル

- `package.json` — `build` スクリプト更新、`pagefind` インストール
- `src/components/Layout.astro` — ヘッダー検索ボックス追加、`activePage` 型拡張
- `src/pages/search.astro` — 新規作成
- `src/components/SearchInterface.tsx` — 新規作成 (Pagefind JS API + prefix filter UI)
- `src/lib/remark/remark-definition-block.ts` — `.definition-block` に `data-pagefind-body` 追加
- `src/pages/posts/[slug].astro` — `data-pagefind-filter` 追加
- `src/pages/defs/[id].astro` — `data-pagefind-filter` 追加・`def-content` から `data-pagefind-body` 削除

---

## エッジケース

- **開発環境 (astro dev)**: `dist/pagefind/` が存在しないため検索は動作しない。`pnpm build` 後に `astro preview` で確認する。Playwright e2e は `astro build` 後に実行する。
- **Pagefind 動的インポート失敗**: `import()` が 404 の場合 (dev 環境など) は catch して「検索インデックスが見つかりません (build 後に利用可能)」と表示する。
- **クエリ空 + フィルタあり**: フィルタのみで検索実行する (全件から絞り込み)。
- **`data-pagefind-filter="tags:..."` の複数タグ**: Pagefind のカンマ区切りは単一の値として扱われる。各タグを別 `<span>` で付与する:
  ```astro
  {tags.map(t => <span data-pagefind-filter={`tags:${t}`} hidden></span>)}
  ```
  `data-pagefind-meta` も同様に変更する。

---

## 未決事項

- `pagefind.filters()` が返すタグ候補が多い場合の表示 (スクロール可能なドロップダウン or 上限 N 件)
- モバイルでのヘッダー検索ボックスのレイアウト (ナビが狭い場合に検索ボックスを折りたたむか)
- Playwright e2e の検索テストは `pnpm build` 後に実行するため、既存 e2e ワークフローと分離するか同一にするか
