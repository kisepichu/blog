/**
 * HTML文字列またはプレーンテキストから OGP description 用テキストを抽出する。
 * HTMLタグを除去し、maxLen 文字を超える場合は末尾に … を付与する。
 */
export function extractDescription(rawText: string, maxLen: number): string {
  // HTMLタグを除去
  const plain = rawText.replace(/<[^>]*>/g, '')
  // 改行・タブを空白に正規化
  const normalized = plain.replace(/[\n\r\t]/g, ' ')
  if (normalized.length <= maxLen) return normalized
  return normalized.slice(0, maxLen) + '…'
}
