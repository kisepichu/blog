# hover-preview

## 概要

`[[term]]` (global concept-link) および `[[#id]]` (local concept-link) にカーソルを合わせると、
definition_block の HTML をポップアップで表示する React island。

- global: `preview-index.json` から `{ title, html }` を取得
- local: 同一ページ上の `.definition-block#id` から innerHTML を取得
- 数式 (MathJax) はポップアップ描画後に再実行 (global のみ。local は既レンダリング済み)
- ポップアップはスタック型でネスト可能 (ポップアップ内の concept-link も hover preview を起動する)

---

## アーキテクチャ

### React island の配置

`<HoverPreview client:load />` を **`Layout.astro`** に配置する。

```astro
<!-- Layout.astro body 内 -->
<HoverPreview client:load baseUrl={import.meta.env.BASE_URL} />
```

- ページ全体の `.concept-link[data-term]` / `.concept-link--local[data-local-id]` に対してイベントリスナーをアタッチ
- concept-link が存在しないページでは何もしない
- popup は `document.body` に portal 描画する

### データソース

| リンク種別 | セレクタ | コンテンツ取得元 | タイトル |
|-----------|---------|----------------|---------|
| global `[[term]]` | `.concept-link[data-term]` | `preview-index.json[id].html` | `preview-index.json[id].title` |
| local `[[#id]]` | `.concept-link--local[data-local-id]` | `document.getElementById(id)` の innerHTML | `#id` (id をそのまま使用) |

`preview-index.json` は `HoverPreview` mount 時に 1 回 fetch する。

---

## concept-link への変更

`remark-concept-link.ts` のローカル定義出力に `data-local-id` を追加する。

**変更前:**
```html
<a class="concept-link concept-link--local" href="#local-f">local-f</a>
```

**変更後:**
```html
<a class="concept-link concept-link--local" data-local-id="local-f" href="#local-f">local-f</a>
```

---

## ポップアップ仕様

### 見た目

```
┌──────────────────────────────────────┐
│ ▸ 半順序集合                          │  ← hover-preview__title (DotGothic16, accent色)
│                                      │
│ 集合 P と反射的・反対称的・推移的な二項関係│  ← hover-preview__body (definition_block の HTML)
│ ≤ の組 (P, ≤) を半順序集合という。   │
└──────────────────────────────────────┘
```

- 幅: `330px`
- `position: fixed`
- 背景: `white`、ボーダー: `1.5px solid var(--def-border)` (accent color)
- box-shadow: `0 6px 24px rgba(61,158,138,0.12), 0 2px 8px rgba(0,0,0,0.07)`
- border-radius: `var(--r-md)`
- フォントサイズ: `0.85rem`、line-height: `1.75`
- `pointer-events: auto` (ポップアップ上でのホバー操作を受け付ける)
- z-index: ベース `9000` + ネスト深さ × 1 (`9000`, `9001`, `9002`, ...)

### 位置計算

```
left = clamp(rect.left, 8px から window.innerWidth - 338px まで)
top  = rect.bottom + 8px  (通常: リンクの下)
      → 下端 (top + popup高さ) が viewport を超える場合:
         top = rect.top - popup高さ - 8px  (リンクの上)
```

popup 高さは DOM 挿入後に `getBoundingClientRect()` で取得して調整する。

---

## インタラクション

### マウス (デスクトップ)

| イベント | 動作 |
|---------|------|
| concept-link に mouseenter | 対応するポップアップを表示 |
| concept-link から mouseleave | 180ms タイマー開始 → ポップアップを閉じる |
| ポップアップに mouseenter | 自身と**すべての祖先ポップアップ**の閉じるタイマーをキャンセル |
| ポップアップから mouseleave | 自身と**すべての子孫ポップアップ**を 180ms 後に閉じる |
| ポップアップ内の concept-link に mouseenter | 子ポップアップを表示 (祖先は維持) |

### タッチ (モバイル)

| 操作 | 動作 |
|-----|------|
| タップ (短押し) | 通常リンク遷移 (preventDefault しない) |
| 長押し (400ms) | ポップアップを表示。`touchend` を preventDefault |
| `touchmove` | 長押しタイマーをキャンセル |
| ポップアップ外をタップ | 全ポップアップを閉じる |

### キーボード

| 操作 | 動作 |
|-----|------|
| concept-link に Tab フォーカス | ポップアップを表示 |
| concept-link から blur | 180ms 後にポップアップを閉じる (フォーカスが popup 内に移った場合はキャンセル) |
| Escape | 全ポップアップを閉じる |

---

## スタック (ネスト) 仕様

- ポップアップ内の concept-link も hover preview の対象
- 各ポップアップは `parent: PopupInstance | null` を持つ
- 子ポップアップが開いている間は親ポップアップを閉じない
- **深さ制限なし** (循環定義は現実的に発生しないため)
- 子ポップアップの位置計算はトリガーリンクを基準にした通常の位置計算と同じ

```
[main content] → [Popup A: poset]
                      ↓ link to "upper-bound"
                  [Popup B: upper-bound]
                      ↓ link to "chain"
                  [Popup C: chain]
```

全ポップアップは `PopupStack` として管理し、閉じる操作は深さを考慮して伝播する。

---

## MathJax

- **global ポップアップ**: DOM 挿入後に `MathJax.typesetPromise([popupBodyElement])` を実行
  - `window.MathJax` が未定義の場合はスキップ (エラーにしない)
- **local ポップアップ**: 既にページ上でレンダリング済みのため再実行不要

---

## 実装対象ファイル

| ファイル | 役割 |
|---------|------|
| `src/components/HoverPreview.tsx` | React island 本体。ポップアップのレンダリング・イベント管理・スタック管理 |
| `src/components/HoverPreview.module.css` | `.hover-preview` / `__title` / `__body` スタイル |
| `src/components/Layout.astro` | `<HoverPreview client:load />` を追加 |
| `src/lib/remark/remark-concept-link.ts` | local リンク出力に `data-local-id` を追加 |
| `src/lib/remark/remark-concept-link.test.ts` | `data-local-id` 出力テストを追加 |

---

## テスト戦略

### Vitest (unit/component)

**`remark-concept-link` テスト追加:**

| ケース | 期待出力 |
|--------|---------|
| `[[#local-f]]` → local リンク | `data-local-id="local-f"` が付与されている |

**`HoverPreview` コンポーネントテスト (React Testing Library):**

| ケース | 期待動作 |
|--------|---------|
| global link に mouseenter | `preview-index.json` のエントリに対応するポップアップが表示される |
| local link に mouseenter | DOM の `.definition-block#id` の内容がポップアップに表示される |
| mouseleave → 180ms 経過 | ポップアップが消える |
| ポップアップに mouseenter | タイマーがキャンセルされポップアップが残る |
| ポップアップ内リンクに mouseenter | 子ポップアップが追加表示される (親は残る) |
| 子ポップアップから mouseleave | 子のみ閉じる (親は残る) |
| 存在しない id | ポップアップを表示しない |

### Playwright (e2e)

| ケース | 検証内容 |
|--------|---------|
| concept-link へのホバー | ポップアップが表示される |
| ポップアップ内の数式 | MathJax レンダリング後に MJX 要素が存在する |
| ポップアップ内リンクへのホバー | 子ポップアップが表示される |
| ポップアップ外へのマウス移動 | ポップアップが閉じる |

---

## エッジケース

| ケース | 挙動 |
|--------|------|
| `preview-index.json` の fetch 失敗 | コンソール warn のみ。hover preview は無効化 |
| `data-term` が `preview-index.json` に存在しない | ポップアップを表示しない |
| `data-local-id` の id に対応する DOM 要素がない | ポップアップを表示しない |
| ポップアップが viewport 外にはみ出る (下) | リンクの上に表示 |
| ポップアップが viewport 外にはみ出る (上も下も無理) | `top: 8px` に固定 |
| 同じ concept-link を連続ホバー | 既存ポップアップを再利用 (新規作成しない) |
| ポップアップ内で同じ term のリンクを再ホバー | そのポップアップより深い子孫を閉じて再表示しない (同一 term は無視) |

---

## 未決事項

なし
