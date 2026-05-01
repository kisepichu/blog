// ![[term]] と [[term]] の両方にマッチする。グループ1: optional '!', グループ2: term
export const CONCEPT_LINK_REGEX = /!?\[\[([^\]]+)\]\]/g

/**
 * テキストから [[term]] / ![[term]] 記法を抽出して term 文字列の配列を返す。
 * [[#id]] (先頭が #) は除外する。
 */
export function parseConceptLinks(text: string): string[] {
  const results: string[] = []
  const regex = new RegExp(CONCEPT_LINK_REGEX.source, 'g')
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const term = match[1]
    if (term.startsWith('#')) continue
    results.push(term)
  }
  return results
}

export const EMBED_REGEX = /^::embed\[([^\]]+)\]$/gm

/**
 * テキストから ::embed[term] 記法を抽出して term 文字列の配列を返す。
 * 行頭 (^) にある場合のみマッチする (gm フラグ)。
 */
export function parseEmbeds(text: string): string[] {
  const results: string[] = []
  // lastIndex 問題を回避するため毎回 new RegExp を使う
  const regex = new RegExp(EMBED_REGEX.source, 'gm')
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    results.push(match[1].trim())
  }
  return results
}
