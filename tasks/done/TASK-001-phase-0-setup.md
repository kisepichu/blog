# TASK-001: phase-0-setup 実装

## 参照仕様

- docs/plan.md (Phase 0 セクション)
- docs/spec.md (技術スタック・アーキテクチャ)

## 実装チェックリスト

### プロジェクト初期化

- [x] Astro v6 プロジェクト初期化 (手動セットアップ)
- [x] @astrojs/react 統合
- [x] TypeScript 設定 (strict)
- [x] ESLint + @typescript-eslint 設定
- [x] Vitest 設定 (src/lib/, src/components/ 向け)
- [x] Playwright 設定 (src/pages/ e2e 向け)

### コンテンツスキーマ

- [x] Astro content collections スキーマ定義 (Post / Definition)

### インフラ

- [x] GitHub Actions ワークフロー (develop push → GitHub Pages)

### スタイリング基盤

- [x] CSS Modules + Google Fonts 読み込み (M PLUS Rounded 1c, DotGothic16, JetBrains Mono)
- [x] グローバル CSS リセット・変数定義

## 完了条件

- [x] pnpm test 全通過
- [x] pnpm astro check クリーン
- [x] pnpm build 成功

## 作業ログ

- 2026-04-19: 作業開始・完了
