# blog

個人学習ブログ。プログラミング言語理論・型理論・論理学・数学の記事と定義を蓄積する静的サイト。

## プロジェクト概要

- **フレームワーク**: Astro v6 + React
- **言語**: TypeScript
- **パッケージマネージャー**: pnpm
- **ホスティング**: GitHub Pages (develop push で自動デプロイ)
- **目玉機能**: `[[term]]` 記法による hover preview — Definition の definition_block をその場で表示

詳細仕様: `docs/spec.md`
機能ごとの詳細: `docs/features/`
開発計画: `docs/plan.md`

> **コードを読む前に仕様を確認すること。** ある機能を実装・変更する場合はまず `docs/features/<feature>.md` を読む。全体仕様は `docs/spec.md`。

## アーキテクチャ

```
content/
  posts/          ← 記事 Markdown
  defs/           ← 定義 Markdown (1ファイル1概念)
src/
  lib/            ← ビルドパイプラインロジック (純粋 TS、Vitest でテスト可能)
    remark/       ← remark/rehype プラグイン
    build/        ← インデックス生成 (preview-index, backlink graph)
    content/      ← コンテンツスキーマ・型定義
  components/     ← React / Astro コンポーネント
  pages/          ← Astro ページ
  styles/         ← CSS Modules
public/
  preview-index.json  ← ビルド時生成
```

**テスト戦略**:
- `src/lib/` → Vitest (純粋関数・remark プラグイン)
- `src/components/` → Vitest + React Testing Library
- `src/pages/` → Playwright (e2e)

## 開発ワークフロー

1. **仕様確認・更新**: `/spec-update <feature>` — 対象機能の仕様を議論・更新
2. **タスク生成・実装開始**: `/spec-do <feature>` — タスクファイル生成 → TDD サイクルを回して実装
3. **レビュー・同期**: `/spec-review <feature>` — 実装と仕様の整合を確認・修正

タスクファイル: `tasks/todo/` → `tasks/doing/` → `tasks/done/`

## 品質チェック

```bash
pnpm astro check   # TypeScript + Astro 型チェック
pnpm lint          # ESLint
pnpm test          # Vitest (unit + component)
pnpm build         # Astro ビルド + Pagefind インデックス生成
pnpm test:e2e      # Playwright (pages の動作確認)
```

## コーディングルール

- `src/lib/` はフロントエンドに依存しない (Astro/React を import しない)
- remark プラグインは `src/lib/remark/` に置く
- CSS は CSS Modules のみ使用 (`*.module.css`)
- コンポーネント名は PascalCase、ファイル名も同じ
- コメントは日本語で書いてよい

## 使用 MCP

| フェーズ | MCP | 用途 |
|---------|-----|------|
| 調査 | Kiri | コードベース検索・コンテキスト抽出 |
| 実装 | Serena | TypeScript シンボルベース編集 |
| ライブラリ調査 | Context7 | Astro・remark・Pagefind・MathJax ドキュメント |
| 動作確認 | Chrome DevTools | hover preview・MathJax レンダリング確認 |
