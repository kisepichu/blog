import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { Root } from 'mdast'
import type { LeafDirective } from 'mdast-util-directive'
import type { Plugin } from 'unified'
import type { AliasMap } from '../build/alias-map'
import type { DefContentMap } from '../build/def-content-map'

interface EmbedDefinitionOptions {
  defContentMap: DefContentMap
  aliasMap: AliasMap
  isProd?: boolean
}

/**
 * ::embed[term] ディレクティブを definition-block--embedded div に変換する remark プラグイン。
 * - alias-map で canonical id に解決し、defContentMap から html を取得する
 * - 解決成功: definition-block definition-block--embedded クラスの div、連番の data-def-number 付き
 * - 解決失敗 (isProd=false): definition-block--embed-unresolved クラスの div
 * - 解決失敗 (isProd=true): プレーンテキスト + console.warn
 */
const remarkEmbedDefinition: Plugin<[EmbedDefinitionOptions], Root> = (options) => {
  const { defContentMap, aliasMap, isProd = false } = options

  return (tree: Root) => {
    let counter = 0

    visit(tree, 'leafDirective', (node: LeafDirective) => {
      if (node.name !== 'embed') return

      // ラベル (children) から term を取得
      const term = toString(node).trim()

      // alias-map で canonical id に解決
      const canonicalId = aliasMap[term]
      const defContent = canonicalId !== undefined ? defContentMap[canonicalId] : undefined

      if (defContent !== undefined) {
        // 解決成功
        counter++
        const n = counter
        node.data = {
          hName: 'div',
          hProperties: {
            className: ['definition-block', 'definition-block--embedded'],
            'data-def-number': n,
          },
        }
        ;(node as unknown as { children: unknown[] }).children = [
          {
            type: 'html',
            value: `<span class="definition-number">定義 ${n}</span>${defContent.html}`,
          },
        ]
      } else if (!isProd) {
        // 解決失敗・開発モード
        node.data = {
          hName: 'div',
          hProperties: {
            className: ['definition-block--embed-unresolved'],
          },
        }
        ;(node as unknown as { children: unknown[] }).children = [
          {
            type: 'text',
            value: term,
          },
        ]
      } else {
        // 解決失敗・本番モード: テキストノードに変換
        console.warn(`[embed-definition] unresolved term: "${term}"`)
        // leafDirective を text ノードとして上書き
        const textNode = node as unknown as { type: string; value: string; data?: unknown; children?: unknown; attributes?: unknown; name?: unknown }
        textNode.type = 'text'
        textNode.value = term
        delete textNode.data
        delete textNode.children
        delete textNode.attributes
        delete textNode.name
      }
    })
  }
}

export default remarkEmbedDefinition
