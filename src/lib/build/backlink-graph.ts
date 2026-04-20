import { parseConceptLinks, parseEmbeds } from '../remark/parse-concept-links'
import type { AliasMap } from './alias-map'

type BacklinkEntry = {
  type: 'post' | 'definition'
  slug: string
  title: string
}
type BacklinkGraph = Record<string, BacklinkEntry[]>

// [[term]] と ::embed[term] を抽出して term 文字列の配列を返す
// [[#id]] は parseConceptLinks がすでに除外するので追加処理不要
export function extractReferences(markdown: string): string[] {
  const fromLinks = parseConceptLinks(markdown) // [[term]] を抽出 (#id は除外済み)
  const fromEmbeds = parseEmbeds(markdown) // ::embed[term] を抽出
  return [...fromLinks, ...fromEmbeds]
}

// alias-map で canonical id に解決する (未解決は除外、重複は除去)
export function resolveLinks(terms: string[], aliasMap: AliasMap): string[] {
  const resolved = new Set<string>()
  for (const term of terms) {
    if (Object.hasOwn(aliasMap, term)) {
      resolved.add(aliasMap[term])
    }
  }
  return [...resolved]
}

// entries の各 body から参照を抽出してバックリンクグラフを構築する
export async function getBacklinkGraph(
  entries: Array<{ type: 'post' | 'definition'; slug: string; title: string; body: string }>,
  aliasMap: AliasMap,
): Promise<BacklinkGraph> {
  const graph: BacklinkGraph = {}

  for (const entry of entries) {
    const terms = extractReferences(entry.body)
    const canonicalIds = resolveLinks(terms, aliasMap)
    for (const id of canonicalIds) {
      if (!graph[id]) graph[id] = []
      // 同じページからの重複を避ける
      const alreadyAdded = graph[id].some((e) => e.slug === entry.slug && e.type === entry.type)
      if (!alreadyAdded) {
        graph[id].push({ type: entry.type, slug: entry.slug, title: entry.title })
      }
    }
  }

  return graph
}
