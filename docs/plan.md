# 開発計画

仕様: `docs/spec.md`
機能ごとの詳細: `docs/features/`

## 開発フロー

### コマンド

| コマンド | 用途 |
|---------|------|
| `/spec-update <feature>` | 機能仕様を議論・更新 |
| `/spec-do <feature>` | タスクファイル生成 → TDD で実装 |
| `/spec-review <feature>` | 実装と仕様の整合確認・修正 |

タスクファイル: `tasks/todo/` → `tasks/doing/` → `tasks/done/`

### TDD サイクル (機能実装時)

```
spec-do
  ├── RED    test-writer subagent がテストを書く (pnpm test で失敗確認)
  ├── GREEN  implementer subagent が最小実装 (pnpm test で通過確認)
  └── REFACTOR 全テストを維持しながらクリーンアップ
```

`src/lib/` と `src/components/` は Vitest、`src/pages/` は Playwright (e2e)。

### 品質チェック (実装完了ごとに実行)

```bash
pnpm astro check   # TypeScript + Astro 型チェック
pnpm lint          # ESLint
pnpm test          # Vitest
pnpm build         # Astro ビルド + Pagefind インデックス生成
```

---

## 実装順序

### Phase 0: 環境構築 ← 今ここ

- [ ] Astro v5 プロジェクト初期化 (pnpm create astro)
- [ ] React 統合 (@astrojs/react)
- [ ] TypeScript 設定
- [ ] ESLint + Vitest 設定
- [ ] Playwright 設定
- [ ] Astro content collections スキーマ定義 (Post / Definition)
- [ ] GitHub Actions ワークフロー (develop push → GitHub Pages)
- [ ] CSS Modules + Google Fonts (M PLUS Rounded 1c, DotGothic16, JetBrains Mono)

### Phase 1: コンテンツ記法実装

実装順: `src/lib/` から始め `src/pages/` へ向かう

- [ ] `/spec-do definition-block` — `:::definition` パース・レンダリング
- [ ] `/spec-do concept-link` — `[[term]]` パース・レンダリング
- [ ] `/spec-do local-definition` — `:::definition{#id}` + `[[#id]]`
- [ ] `/spec-do preview-index` — preview-index.json ビルド時生成
- [ ] `/spec-do backlink-graph` — 参照グラフ自動生成

### Phase 2: ページ実装 (MVP)

- [ ] `/spec-do def-page` — `/defs/[id]` 定義ページ
- [ ] `/spec-do post-page` — `/posts/[slug]` 記事ページ
- [ ] `/spec-do tag-page` — `/tags/[tag]` タグページ
- [ ] `/spec-do home-page` — `/` ホームページ

### Phase 3: インタラクティブ機能

- [ ] `/spec-do hover-preview` — hover preview React island + MathJax 再実行
- [ ] `/spec-do search` — Pagefind 統合
- [ ] `/spec-do series-nav` — series prev/next ナビゲーション

### Phase 4: UI

- [ ] `/spec-do ui-base` — カラー・タイポグラフィ・基本レイアウト
- [ ] 各ページの CSS 仕上げ

---

## 確定事項

| 項目 | 決定内容 |
|------|----------|
| フレームワーク | Astro v5 + React |
| 言語 | TypeScript |
| パッケージマネージャー | pnpm |
| スタイリング | CSS Modules |
| 数式 | MathJax (CDN) + bussproofs |
| 検索 | Pagefind |
| Markdown 拡張 | remark-directive |
| ホスティング | GitHub Pages |
| デプロイトリガー | develop push |
| ドメイン | Post / Definition の 2 種類 |
| 目玉機能 | `[[term]]` hover preview (definition_block) |
| backlink | getStaticPaths で自動生成 |
| preview-index | public/preview-index.json をビルド時生成 |
| 本文フォント | M PLUS Rounded 1c |
| UI フォント | DotGothic16 |
| コードフォント | JetBrains Mono |
| series ページ | あり (/series/[slug]) — Phase 2 以降 |
| /defs 一覧 | 後回し |
| /tags 一覧 | 後回し |
