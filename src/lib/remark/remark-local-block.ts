import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import type { VFile } from 'vfile'
import { LOCAL_BLOCK_TYPES } from './local-block-config'

const LOCAL_BLOCK_MAP = new Map(LOCAL_BLOCK_TYPES.map((t) => [t.name, t]))

export default function remarkLocalBlock() {
  return (tree: Root, file: VFile) => {
    if (!file.data.localIds) {
      file.data.localIds = new Set<string>()
    }
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      const blockType = LOCAL_BLOCK_MAP.get(node.name)
      if (!blockType) return

      const id = node.attributes?.id
      if (!id) {
        console.warn(`[local-block] :::${node.name} には {#id} が必要です。変換をスキップします。`)
        return
      }

      ;(file.data.localIds as Set<string>).add(id)

      const rawTitle = node.attributes?.title
      const trimmedTitle = typeof rawTitle === 'string' ? rawTitle.trim() : ''
      const hasExplicitTitle = trimmedTitle.length > 0
      const labelText = hasExplicitTitle
        ? `▶ ${blockType.label} (${trimmedTitle})`
        : `▶ ${blockType.label}`

      const ct = blockType.colorToken
      node.data = {
        hName: 'div',
        hProperties: {
          className: ['local-block', `${blockType.name}-block`],
          id,
          'data-block-label': blockType.label,
          style: `--block-bg:var(--${ct}-bg);--block-b:var(--${ct}-b);--block-fg:var(--${ct})`,
          ...(hasExplicitTitle ? { 'data-block-title': trimmedTitle } : {}),
          ...(blockType.pagefindIgnore ? { 'data-pagefind-ignore': true } : {}),
        },
      }

      // スクリーンリーダー対応: 実体のあるラベル要素を先頭に挿入
      node.children.unshift({
        type: 'paragraph',
        data: { hName: 'span', hProperties: { className: ['local-block__label'] } },
        children: [{ type: 'text', value: labelText }],
      })
    })
  }
}
