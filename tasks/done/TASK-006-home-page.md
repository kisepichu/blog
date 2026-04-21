# TASK-006: home-page 実装

## 参照仕様

- docs/features/home-page.md

## ブランチ

`feat/phase-2-home-page`

## 実装チェックリスト

### src/styles/

- [x] global.css に `.home-hero` / `.home-hero__prompt` / `.home-title` / `.home-subtitle` を追加
- [x] global.css に `.home-grid` (2カラム、モバイル1カラム) を追加
- [x] global.css に `.series-card` / `.series-card__title` / `.series-card__count` を追加
- [x] global.css の `.post-card` に `.post-card__tags` / `.post-card__series` を追加
- [x] global.css に `.view-all` を追加

### src/pages/

- [x] index.astro: hero セクション (`~/blog $ ls`, h1, subtitle)
- [x] index.astro: データ取得 (posts date降順, defs id順, series集計, tags収集)
- [x] index.astro: 最新記事5件 post-card (date, tags, series 情報付き)
- [x] index.astro: "すべての記事を見る" リンク (6件以上時のみ)
- [x] index.astro: aside シリーズ一覧 (series-card、シリーズなしなら非表示)
- [x] index.astro: aside 最近の定義4件 (def-compact、定義なしなら非表示)
- [x] index.astro: aside タグ一覧 (TagBadge 全タグ、タグなしなら非表示)
- [x] index.astro: `data-pagefind-ignore` 設定

## 完了条件

- [x] pnpm test:e2e 全通過 (26/26)
- [x] pnpm astro check クリーン (0 errors)
- [x] pnpm lint クリーン
- [x] pnpm build 成功

## 作業ログ

- 2026-04-22: 作業開始・完了
