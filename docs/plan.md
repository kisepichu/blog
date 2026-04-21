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
  ├── RED    test-writer subagent がテストを書く
  │           src/lib/, src/components/ → pnpm vitest run で失敗確認
  │           src/pages/               → pnpm test:e2e で失敗確認
  ├── GREEN  implementer subagent が最小実装で通過確認
  └── REFACTOR 全テストを維持しながらクリーンアップ
```

### 品質チェック (実装完了ごとに実行)

```bash
pnpm astro check   # TypeScript + Astro 型チェック
pnpm lint          # ESLint
pnpm test          # Vitest
pnpm build         # Astro ビルド (本番モード) + Pagefind インデックス生成
pnpm test:e2e      # Playwright (ページ実装後)
```

---

## 実装順序

### Phase 0: 環境構築 ✅ 完了

- [x] Astro v6 プロジェクト初期化
- [x] React 統合 (@astrojs/react)
- [x] TypeScript 設定 (strict)
- [x] ESLint + Vitest 設定
- [x] Playwright 設定
- [x] Astro content collections スキーマ定義 (Post / Definition)
- [x] GitHub Actions ワークフロー (develop push → GitHub Pages)
- [x] CSS Modules + Google Fonts (M PLUS Rounded 1c, DotGothic16, JetBrains Mono)

### Phase 1: コンテンツ記法実装

実装順: `src/lib/` から始め `src/pages/` へ向かう

まず Phase 1 全機能の仕様を作成してから実装に入る (機能が密結合なため)。

**[spec-update フェーズ]**

- [x] `/spec-update definition-block` — `:::definition` パース・レンダリング仕様
- [x] `/spec-update concept-link` — `[[term]]` パース・alias-map 設計を含む
- [x] `/spec-update local-definition` — `:::definition{#id}` + `[[#id]]` 仕様
- [x] `/spec-update embed-definition` — `::embed[term]` global 定義インライン展開仕様
- [x] `/spec-update preview-index` — preview-index.json ビルド時生成仕様
- [x] `/spec-update backlink-graph` — 参照グラフ自動生成仕様

**[実装フェーズ]**

- [x] `/spec-do definition-block`
- [x] `/spec-do concept-link`
- [x] `/spec-do embed-definition`  ← defContentMap 構築 (preview-index と共有インフラ)
- [x] `/spec-do local-definition`
- [x] `/spec-do preview-index`
- [x] `/spec-do backlink-graph`

### Phase 2: ページ実装 (MVP)

Phase 1 と異なり各ページの依存が疎なため、**ページごとにブランチを切る**。  
共有コンポーネント (Layout, Breadcrumb, TagBadge, Backlinks) と CSS トークンは def-page ブランチに含める。  
hover-preview (Phase 3) は後回し — Phase 2 では concept-link は静的リンクとして表示する。

**[spec-update → spec-do サイクル]**

- [x] `/spec-update def-page`   ← Layout・CSS トークン・共有コンポーネントも含む
- [x] `/spec-do def-page`       ← feat/phase-2-def-page ブランチ
- [x] `/spec-update post-page`
- [x] `/spec-do post-page`      ← feat/phase-2-post-page ブランチ
- [x] `/spec-update tag-page`
- [x] `/spec-do tag-page`       ← feat/phase-2-tag-page ブランチ
- [ ] `/spec-update home-page`
- [ ] `/spec-do home-page`      ← feat/phase-2-home-page ブランチ
- [ ] `/spec-update series-page` ← デザイン・spec.md に記載あり。plan 未掲載だったため追加
- [ ] `/spec-do series-page`    ← feat/phase-2-series-page ブランチ

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
| フレームワーク | Astro v6 + React |
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
| preview-index | public/preview-index.json を astro:config:setup 時に生成 |
| 定義埋め込み | `::embed[term]` でビルド時静的展開・定義番号付与 |
| 本文フォント | M PLUS Rounded 1c |
| UI フォント | DotGothic16 |
| コードフォント | JetBrains Mono |
| series ページ | あり (/series/[slug]) — Phase 2 以降 |
| /defs 一覧 | 後回し |
| /tags 一覧 | 後回し |
