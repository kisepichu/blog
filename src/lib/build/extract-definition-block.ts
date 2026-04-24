/**
 * HTML 文字列から <div class="definition-block"> の inner HTML を抽出する。
 * - definition-block--extra は対象外
 * - 見つからなければ null を返す
 * - 複数ある場合は先頭のみを返す
 * - ネストした <div> を含む場合も正しく対応する (非貪欲 regex ではなく深さ追跡)
 */
export function extractDefinitionBlockHtml(html: string): string | null {
  // class="definition-block" を持つ <div> にマッチ (属性順に依存しない)
  // data-pagefind-body 等の属性が class より前に出力されても正しく検出できる
  const match = html.match(/<div\b[^>]*\bclass="definition-block"[^>]*>/)
  if (!match || match.index === undefined) return null

  const startIdx = match.index
  const contentStart = startIdx + match[0].length
  let depth = 1
  let i = contentStart

  while (i < html.length && depth > 0) {
    if (html[i] === '<') {
      if (html.startsWith('</div>', i)) {
        depth--
        if (depth === 0) break
        i += 6
      } else if (html.startsWith('<div', i) && (html[i + 4] === ' ' || html[i + 4] === '>')) {
        depth++
        i++
      } else {
        i++
      }
    } else {
      i++
    }
  }

  if (depth !== 0) return null
  return html.slice(contentStart, i)
}
