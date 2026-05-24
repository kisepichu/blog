/**
 * Markdown / HTML 混在テキストから OGP description 用プレーンテキストを抽出する。
 * ブロック構造 (directive/見出し/コードフェンス/数式ブロック) と
 * インラインマークアップ (HTML タグ/インライン数式/concept-link/装飾) を除去し、
 * maxLen 文字を超える場合は末尾に … を付与する。
 */
export function extractDescription(rawText: string, maxLen: number): string {
  let text = rawText

  // ブロック: :::directive ... ::: (複数行)
  text = text.replace(/:::[\w]*[^\n]*\n[\s\S]*?:::/g, '')

  // ブロック: コードフェンス ``` ... ```
  text = text.replace(/```[\s\S]*?```/g, '')

  // ブロック: 数式 $$ ... $$
  text = text.replace(/\$\$[\s\S]*?\$\$/g, '')

  // ブロック: ::embed[term]
  text = text.replace(/::embed\[[^\]]*\]/g, '')

  // [[concept-link]] / ![[concept-link]] → 内側テキストに置換 (語を残す)
  text = text.replace(/!?\[\[([^\]]*)\]\]/g, '$1')

  // インライン: Markdown リンク ![alt](url) / [text](url) → テキストのみ残す
  text = text.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')

  // ブロック: Markdown 見出し (行頭 # ...)
  text = text.replace(/^#{1,6}\s+.*/gm, '')

  // インライン: HTML タグ
  text = text.replace(/<[^>]*>/g, '')

  // インライン: 数式 $...$
  text = text.replace(/\$[^$\n]+\$/g, '')

  // インライン: **bold** / *italic*
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/\*([^*]+)\*/g, '$1')

  // インライン: `code`
  text = text.replace(/`([^`]+)`/g, '$1')

  // 改行・タブを空白に正規化し、連続空白をまとめる
  text = text.replace(/[\n\r\t]/g, ' ')
  text = text.replace(/  +/g, ' ').trim()

  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '…'
}
