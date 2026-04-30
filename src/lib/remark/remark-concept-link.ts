import { visit, SKIP } from 'unist-util-visit'
import type { Root, Text, Parent, PhrasingContent } from 'mdast'
import type { Plugin } from 'unified'
import type { VFile } from 'vfile'
import type { AliasMap, DefMetaMap } from '../build/alias-map'

interface ConceptLinkOptions {
  aliasMap: AliasMap
  defMetaMap?: DefMetaMap
  baseUrl: string
  isProd?: boolean
}

const CONCEPT_LINK_REGEX_SOURCE = /\[\[([^\]]+)\]\]/.source

/**
 * hName/hProperties 付きのリンクノードを PhrasingContent として生成する。
 * mdast-util-to-hast の型拡張は直接インポートできないため、
 * data フィールドは独自定義の型で扱う。
 */
interface HastLinkData {
  hName: string
  hProperties: Record<string, unknown>
}

interface ConceptLinkNode {
  type: 'link'
  url: string
  data: HastLinkData
  children: [{ type: 'text'; value: string }]
}

function makeConceptLinkNode(
  url: string,
  classNames: string[],
  term: string,
  canonicalId?: string,
  localId?: string,
): ConceptLinkNode {
  const hProperties: Record<string, unknown> = {
    className: classNames,
    href: url,
  }
  if (localId !== undefined) {
    hProperties['data-local-id'] = localId
  }
  if (canonicalId !== undefined) {
    hProperties['data-term'] = canonicalId
  }
  return {
    type: 'link',
    url,
    data: { hName: 'a', hProperties },
    children: [{ type: 'text', value: term }],
  }
}

/**
 * テキストを [[term]] で分割し、mdast ノードの配列を返す。
 * - マッチ前後: Text ノード
 * - [[term]] が localIds に含まれる: concept-link--local リンク (href="#term")
 * - [[term]] が aliasMap で解決できる: Link ノード (data.hProperties で class/href/data-term を設定)
 * - [[#id]] が localIds に含まれる: concept-link--local リンク (href="#id")
 * - [[#id]] が localIds にない・開発: Link ノード (concept-link--unresolved)
 * - [[#id]] が localIds にない・本番: Text ノード + console.warn
 * - 解決失敗・開発: Link ノード (concept-link--unresolved)
 * - 解決失敗・本番: Text ノード + console.warn
 */
function splitByConceptLinks(
  value: string,
  options: ConceptLinkOptions,
  localIds: Set<string> | undefined,
): PhrasingContent[] {
  const { aliasMap, isProd = false } = options
  const defMetaMap = options.defMetaMap ?? (Object.create(null) as DefMetaMap)
  // baseUrl を末尾 / 付きに正規化 (例: '/blog' → '/blog/')
  const baseUrl = options.baseUrl.replace(/\/?$/, '/')
  const parts: PhrasingContent[] = []
  const regex = new RegExp(CONCEPT_LINK_REGEX_SOURCE, 'g')
  let lastIndex = 0
  let anyMatch = false
  let match: RegExpExecArray | null

  while ((match = regex.exec(value)) !== null) {
    const term = match[1]
    const start = match.index
    const end = regex.lastIndex

    // [[#anchor]] の処理
    if (term.startsWith('#')) {
      const id = term.slice(1)
      if (localIds === undefined) {
        // localIds が未設定: 旧来のスキップ動作
        continue
      } else if (localIds.has(id)) {
        // localIds に含まれる: concept-link--local リンク
        anyMatch = true
        if (start > lastIndex) {
          parts.push({ type: 'text', value: value.slice(lastIndex, start) })
        }
        const localHref = `#${id}`
        parts.push(makeConceptLinkNode(localHref, ['concept-link', 'concept-link--local'], id, undefined, id) as unknown as PhrasingContent)
        lastIndex = end
      } else {
        // localIds にない: unresolved (dev) or plain text (prod)
        anyMatch = true
        if (start > lastIndex) {
          parts.push({ type: 'text', value: value.slice(lastIndex, start) })
        }
        if (!isProd) {
          parts.push(makeConceptLinkNode('#', ['concept-link', 'concept-link--unresolved'], id) as unknown as PhrasingContent)
        } else {
          console.warn(`[concept-link] unresolved local anchor: "#${id}"`)
          parts.push({ type: 'text', value: id })
        }
        lastIndex = end
      }
      continue
    }

    // [[term]] が localIds に含まれる → local リンク (aliasMap より優先)
    if (localIds !== undefined && localIds.has(term)) {
      anyMatch = true
      if (start > lastIndex) {
        parts.push({ type: 'text', value: value.slice(lastIndex, start) })
      }
      const localHref = `#${term}`
      parts.push(makeConceptLinkNode(localHref, ['concept-link', 'concept-link--local'], term, undefined, term) as unknown as PhrasingContent)
      lastIndex = end
      continue
    }

    anyMatch = true

    // マッチ前のテキスト
    if (start > lastIndex) {
      parts.push({ type: 'text', value: value.slice(lastIndex, start) })
    }

    const canonicalId = Object.hasOwn(aliasMap, term) ? aliasMap[term] : undefined

    if (canonicalId !== undefined) {
      // 解決成功: <a class="concept-link" data-term="{canonicalId}" href="{baseUrl}/defs/{canonicalId}">{linkText}</a>
      const href = `${baseUrl}defs/${canonicalId}`
      const meta = defMetaMap[canonicalId]
      const linkText = meta !== undefined
        ? (meta.english !== '' ? `${meta.title}(${meta.english})` : meta.title)
        : term
      parts.push(makeConceptLinkNode(href, ['concept-link'], linkText, canonicalId) as unknown as PhrasingContent)
    } else if (!isProd) {
      // 解決失敗・開発モード: <a class="concept-link concept-link--unresolved" href="#">{term}</a>
      parts.push(makeConceptLinkNode('#', ['concept-link', 'concept-link--unresolved'], term) as unknown as PhrasingContent)
    } else {
      // 解決失敗・本番モード: プレーンテキスト + console.warn
      console.warn(`[concept-link] unresolved term: "${term}"`)
      parts.push({ type: 'text', value: term })
    }

    lastIndex = end
  }

  // [[term]] が一切なかった (または全部 #anchor でスキップ) の場合は元の Text ノードをそのまま返す
  if (!anyMatch) {
    return [{ type: 'text', value }]
  }

  // 残りのテキスト
  if (lastIndex < value.length) {
    parts.push({ type: 'text', value: value.slice(lastIndex) })
  }

  return parts
}

const remarkConceptLink: Plugin<[ConceptLinkOptions], Root> = (options) => {
  return (tree: Root, file: VFile) => {
    const localIds = file.data.localIds as Set<string> | undefined
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return
      // グローバル regex の lastIndex をリセットするため毎回 new RegExp を使う
      if (!new RegExp(CONCEPT_LINK_REGEX_SOURCE).test(node.value)) return

      const parts = splitByConceptLinks(node.value, options, localIds)

      // 変換なし (全部 #anchor でスキップかつ localIds にない) の場合
      if (parts.length === 1 && parts[0].type === 'text') return

      ;(parent as Parent).children.splice(
        index,
        1,
        ...(parts as Parent['children']),
      )
      return [SKIP, index + parts.length]
    })
  }
}

export default remarkConceptLink
