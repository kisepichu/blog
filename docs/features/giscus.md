# giscus

## 概要

[giscus](https://giscus.app/ja) を使った GitHub Discussions ベースのコメント機能。
記事ページ・定義ページの backlink セクションの下にコメント欄を表示する。

---

## 仕様

### 対象ページ

| ページ | URL |
|---|---|
| 記事ページ | `/posts/[slug]` |
| 定義ページ | `/defs/[id]` |

### 配置

backlink セクション (`<Backlinks />`) の**下**に `<GiscusComments />` コンポーネントを配置する。

```
<article>...</article>
<Backlinks items={backlinks} />
<GiscusComments />   ← ここ
```

### giscus 設定

| 項目 | 値 |
|---|---|
| リポジトリ | `kisepichu/blog` |
| repo-id | `R_kgDOSGOExQ` |
| マッピング方式 | `pathname` (URL パスで Discussion を自動対応) |
| Discussion カテゴリ | `Announcements` |
| category-id | `DIC_kwDOSGOExc4C7w7r` |
| テーマ | カスタム (`public/giscus-theme.css`) |
| 言語 | `ja` |
| reactions-enabled | `1` (有効) |
| emit-metadata | `0` (無効) |
| input-position | `top` (コメント入力欄をコメント一覧の上に表示) |
| strict | `0` |

### カスタムテーマファイル

`public/giscus-theme.css` にブログのデザイントークン (`src/styles/tokens.css`) に合わせた CSS 変数を定義する。
GitHub Pages にデプロイされると `${SITE}${BASE_URL}giscus-theme.css` で公開アクセス可能になる。

テーマ URL は `Astro.url.origin` をフォールバックに使い、常に絶対 URL を生成する。
ただし giscus の iframe は HTTPS で動作するため、HTTP の URL はブラウザの Mixed Content 制限でブロックされる。
`--site` が渡されない dev/preview 環境では `http://localhost:...` になるため、`themeUrl` が `https://` で始まる場合のみカスタムテーマを使い、それ以外は組み込みテーマ `catppuccin_latte` にフォールバックする。

### コンポーネント設計

`<GiscusComments />` は Astro コンポーネントとして実装し、`<script>` タグで giscus の埋め込みスクリプトを出力する。

```astro
<!-- src/components/GiscusComments.astro -->
---
const siteOrigin = import.meta.env.SITE ?? Astro.url.origin
const basePath = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`
const themeUrl = new URL(`${basePath}giscus-theme.css`, siteOrigin).toString()
// HTTP URL は Mixed Content でブロックされるため、HTTPS のときのみカスタムテーマを使用する
const theme = themeUrl.startsWith('https://') ? themeUrl : 'catppuccin_latte'
---
<div class="giscus-wrapper">
  <script
    is:inline
    src="https://giscus.app/client.js"
    ...
    data-theme={theme}
    ...
  ></script>
</div>
```

### CSS

```css
.giscus-wrapper {
  margin-top: 3rem;
}
```

---

## 実装対象ファイル

- `src/components/GiscusComments.astro` — giscus 埋め込みコンポーネント
- `src/pages/posts/[slug].astro` — `<GiscusComments />` を追加
- `src/pages/defs/[id].astro` — `<GiscusComments />` を追加

---

## エッジケース

| ケース | 挙動 |
|---|---|
| JavaScript 無効 | giscus スクリプトが動かずコメント欄非表示。許容する |
| ローカル開発環境 | pathname が本番と異なるため Discussion は別途作成される。許容する |
| `status: draft` の記事 | ページ自体が本番ビルドに含まれないためコメント欄も表示されない |

---

## 未決事項

- なし
